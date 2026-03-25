import { Modal } from '@/components/ui/modal';
import { HowlColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { getApp } from '@react-native-firebase/app';
import { addDoc, collection, getDocs, getFirestore, query, serverTimestamp, where, type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { GoogleSigninButton, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { Image } from 'expo-image';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { CalendarProvider, WeekCalendar } from 'react-native-calendars';

const TARGET_IMAGE_BYTES = 500 * 1024;
const MAX_BASE64_FOR_FIRESTORE_CHARS = 900000;

type ReflectionDoc = {
  id: string;
  notes: string;
  imageBase64: string | null;
  dateKey: string;
};

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const estimateBytesFromBase64 = (base64: string) => {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};

const compressImageUnderTarget = async (uri: string) => {
  let width = 1600;
  let quality = 0.8;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const compressed = await manipulateAsync(
      uri,
      [{ resize: { width } }],
      { compress: quality, format: SaveFormat.JPEG, base64: true },
    );

    if (!compressed.base64) {
      return null;
    }

    const sizeBytes = estimateBytesFromBase64(compressed.base64);
    if (sizeBytes <= TARGET_IMAGE_BYTES) {
      return {
        uri: compressed.uri,
        base64: compressed.base64,
        sizeBytes,
      };
    }

    if (quality > 0.45) {
      quality -= 0.15;
    } else {
      width = Math.max(640, Math.floor(width * 0.8));
      quality = 0.8;
    }
  }

  return null;
};

export default function SessionHistoryScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { user, initializing, error: authError, signInWithGoogleAccount, signOutUser, clearError } = useAuth();

  const [error, setError] = useState<string | null>(authError);
  const [entryNotes, setEntryNotes] = useState('');
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(getLocalDateKey());
  const [reflections, setReflections] = useState<ReflectionDoc[]>([]);
  const [isLoadingReflections, setIsLoadingReflections] = useState(false);
  const [markedDateKeys, setMarkedDateKeys] = useState<string[]>([]);

  const todayKey = getLocalDateKey();
  const isSelectedToday = selectedDate === todayKey;
  const calendarCardWidth = Math.min(screenWidth - 24, 364);
  const weekCalendarWidth = calendarCardWidth - 20;

  useEffect(() => {
    setError(authError);
  }, [authError]);

  const fetchMarkedDates = useCallback(async () => {
    if (!user) {
      setMarkedDateKeys([]);
      return;
    }

    try {
      const firestore = getFirestore(getApp());
      const reflectionsQuery = query(
        collection(firestore, 'reflections'),
        where('userId', '==', user.uid),
      );

      const snapshot = await getDocs(reflectionsQuery);
      const keys = new Set<string>();

      snapshot.docs.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = doc.data() as { dateKey?: string };
        if (data.dateKey) {
          keys.add(data.dateKey);
        }
      });

      setMarkedDateKeys(Array.from(keys));
    } catch {
      setMarkedDateKeys([]);
    }
  }, [user]);

  const fetchReflectionsByDate = useCallback(async () => {
    if (!user) {
      setReflections([]);
      return;
    }

    setIsLoadingReflections(true);
    try {
      const firestore = getFirestore(getApp());
      const reflectionsQuery = query(
        collection(firestore, 'reflections'),
        where('userId', '==', user.uid),
        where('dateKey', '==', selectedDate),
      );

      const snapshot = await getDocs(reflectionsQuery);
      const rows: ReflectionDoc[] = snapshot.docs.map((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = doc.data() as { notes?: string; imageBase64?: string | null; dateKey?: string };
        return {
          id: doc.id,
          notes: data.notes ?? '',
          imageBase64: data.imageBase64 ?? null,
          dateKey: data.dateKey ?? selectedDate,
        };
      });

      setReflections(rows);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Failed to load reflections.';
      setFormMessage(message);
      setReflections([]);
    } finally {
      setIsLoadingReflections(false);
    }
  }, [selectedDate, user]);

  useEffect(() => {
    void fetchReflectionsByDate();
  }, [fetchReflectionsByDate]);

  useEffect(() => {
    void fetchMarkedDates();
  }, [fetchMarkedDates]);

  const markedDates = markedDateKeys.reduce<Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string; selectedDotColor?: string }>>(
    (accumulator, dateKey) => {
      accumulator[dateKey] = {
        marked: true,
        dotColor: '#294A68',
      };
      return accumulator;
    },
    {},
  );

  markedDates[selectedDate] = {
    ...markedDates[selectedDate],
    selected: true,
    selectedColor: '#294A68',
    selectedDotColor: '#FFFFFF',
  };

  const signIn = async () => {
    setError(null);

    try {
      await signInWithGoogleAccount();
    } catch (caughtError) {
      if (isErrorWithCode(caughtError)) {
        if (caughtError.code === statusCodes.SIGN_IN_CANCELLED) {
          setError('User cancelled the login flow');
        } else if (caughtError.code === statusCodes.IN_PROGRESS) {
          setError('Sign in is currently in progress');
        } else if (caughtError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setError('Google Play Services are not available');
        } else {
          setError(`Something went wrong: ${caughtError.message}`);
        }
      } else {
        setError('Something went wrong during sign in');
      }
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
      clearError();
      setError(null);
      setFormMessage(null);
      setEntryNotes('');
      setImageBase64(null);
      setImagePreviewUri(null);
    } catch (caughtError) {
      setError(`Something went wrong: ${caughtError}`);
    }
  };

  const closeModal = () => {
    router.back();
  };

  const selectImageAsset = async (source: 'camera' | 'gallery') => {
    const permissionResponse =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResponse.granted) {
      setFormMessage('Permission denied. Please allow access in settings.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.9,
          base64: true,
        })
        : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.9,
          base64: true,
        });

    if (result.canceled || !result.assets.length) {
      return;
    }

    const compressed = await compressImageUnderTarget(result.assets[0].uri);
    if (!compressed) {
      setFormMessage('Could not compress image under 500KB. Please choose a different image.');
      return;
    }

    setImageBase64(compressed.base64);
    setImagePreviewUri(compressed.uri);
    setFormMessage(`Image selected (${Math.round(compressed.sizeBytes / 1024)}KB).`);
  };

  const openCameraMenu = () => {
    Alert.alert('Add Photo', 'Take a new photo or choose one from gallery', [
      { text: 'Take Photo', onPress: () => void selectImageAsset('camera') },
      { text: 'Choose from Gallery', onPress: () => void selectImageAsset('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const saveSessionEntry = async () => {
    setFormMessage(null);

    if (!user) {
      setFormMessage('Please sign in before saving.');
      return;
    }

    if (!entryNotes.trim()) {
      setFormMessage('Please add your notes before saving.');
      return;
    }

    if (!isSelectedToday) {
      setFormMessage('You can only submit today reflections from this form.');
      return;
    }

    if (imageBase64 && imageBase64.length > MAX_BASE64_FOR_FIRESTORE_CHARS) {
      setFormMessage('Image is too large for Firestore document storage. Please use a smaller image.');
      return;
    }

    setIsSaving(true);

    try {
      const firestore = getFirestore(getApp());

      await addDoc(collection(firestore, 'reflections'), {
        userId: user.uid,
        userEmail: user.email ?? null,
        notes: entryNotes.trim(),
        dateKey: selectedDate,
        mediaType: imageBase64 ? 'image' : null,
        imageBase64: imageBase64 ?? null,
        createdAt: serverTimestamp(),
      });

      setEntryNotes('');
      setImageBase64(null);
      setImagePreviewUri(null);
      setFormMessage('Session saved to Firestore.');
      await fetchReflectionsByDate();
      await fetchMarkedDates();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Failed to save session.';
      setFormMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      onClose={closeModal}
      backgroundColor={HowlColors.blue_100}
      titleSection={
        <View style={styles.headerSection}>
          <Pressable style={styles.closeButton} onPress={closeModal}>
            <Image source={require('@/assets/icons/icon-close.png')} style={styles.closeIcon} contentFit="contain" />
          </Pressable>
          <Text style={styles.title}>Session History</Text>
        </View>
      }
      contentSection={
        <ScrollView
          style={styles.middleSection}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {initializing ? (
            <View style={styles.signInContainer}>
              <Text style={styles.subtitle}>Checking your saved session...</Text>
            </View>
          ) : user ? (
            <View style={styles.profileContainer}>
              <View style={styles.usernameContainer}>
                <Text style={styles.subtitle}>
                  Welcome, <Text style={styles.subtitleBold}>{user.displayName || user.email || 'User'}</Text>
                </Text>
                <Text style={styles.email}>Email: {user.email || '-'}</Text>

                <View style={[styles.calendarCard, { width: calendarCardWidth }]}>
                  <CalendarProvider date={selectedDate} onDateChanged={setSelectedDate}>
                    <WeekCalendar
                      calendarWidth={weekCalendarWidth}
                      style={styles.weekCalendar}
                      firstDay={1}
                      onDayPress={(day) => setSelectedDate(day.dateString)}
                      markedDates={markedDates}
                      theme={{
                        calendarBackground: '#F3F7FB',
                        textSectionTitleColor: '#294A68',
                        selectedDayBackgroundColor: '#294A68',
                        selectedDayTextColor: '#FFFFFF',
                        todayTextColor: '#1D4ED8',
                        dayTextColor: '#1F2937',
                        monthTextColor: '#1F2937',
                        arrowColor: '#294A68',
                      }}
                    />
                  </CalendarProvider>
                </View>

                {isLoadingReflections ? <Text style={styles.infoText}>Loading reflections...</Text> : null}

                {!isLoadingReflections && reflections.length > 0 ? (
                  <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Your Reflection</Text>
                    {reflections.map((reflection) => (
                      <View key={reflection.id} style={styles.reflectionItem}>
                        <Text style={styles.reflectionNotes}>{reflection.notes}</Text>
                        {reflection.imageBase64 ? (
                          <Image
                            source={{ uri: `data:image/jpeg;base64,${reflection.imageBase64}` }}
                            style={styles.imagePreview}
                            contentFit="contain"
                          />
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}

                {!isLoadingReflections && isSelectedToday && reflections.length === 0 ? (
                  <View style={styles.formCard}>
                    <Text style={styles.formTitle}>New Session Entry</Text>

                    <TextInput
                      value={entryNotes}
                      onChangeText={setEntryNotes}
                      placeholder="Write your notes"
                      placeholderTextColor={HowlColors.gray_80}
                      multiline
                      style={[styles.formInput, styles.formTextarea]}
                    />

                    <Text style={styles.mediaLabel}>Photo (Optional)</Text>
                    <View style={styles.mediaSelectorRow}>
                      <Pressable style={[styles.mediaChip, styles.mediaChipActive]} onPress={openCameraMenu}>
                        <Text style={[styles.mediaChipText, styles.mediaChipTextActive]}>
                          {imageBase64 ? 'Change Photo' : 'Add Photo'}
                        </Text>
                      </Pressable>
                    </View>

                    {imagePreviewUri ? (
                      <Image source={{ uri: imagePreviewUri }} style={styles.imagePreview} contentFit="contain" />
                    ) : null}

                    <Pressable style={styles.formSubmitButton} onPress={saveSessionEntry} disabled={isSaving}>
                      <Text style={styles.formSubmitButtonText}>{isSaving ? 'Saving...' : 'Save Entry'}</Text>
                    </Pressable>

                    {formMessage ? <Text style={styles.formMessage}>{formMessage}</Text> : null}
                  </View>
                ) : null}

                {!isLoadingReflections && !isSelectedToday && reflections.length === 0 ? (
                  <Text style={styles.infoText}>you dont have any reflections this date :(</Text>
                ) : null}

                <Pressable style={styles.signOutButton} onPress={signOut}>
                  <Text style={styles.signOutButtonText}>Sign Out</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.signInContainer}>
              <Text style={styles.subtitle}>To try this feature, please sign in with your Google account.</Text>
              <GoogleSigninButton
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Light}
                onPress={signIn}
                style={styles.signInButton}
              />
            </View>
          )}

          {error ? (
            <View style={styles.errorBadge}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>
      }
      footerSection={<View style={styles.footerSection} />}
    />
  );
}

const styles = StyleSheet.create({
  headerSection: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  middleSection: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 32,
  },
  footerSection: {
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    left: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  closeIcon: {
    width: 20,
    height: 24,
  },
  title: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 24,
    color: HowlColors.gray_80,
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    color: HowlColors.gray_80,
    fontSize: 18,
    fontFamily: 'NunitoSans-Medium',
    fontWeight: 'normal',
    textAlign: 'center',
  },
  subtitleBold: {
    fontFamily: 'NunitoSans-Bold',
  },
  profileContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  usernameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  email: {
    color: HowlColors.gray_80,
    fontSize: 16,
    fontFamily: 'NunitoSans-Regular',
  },
  calendarCard: {
    width: 364,
    borderRadius: 16,
    backgroundColor: '#F3F7FB',
    padding: 10,
    marginTop: 8,
  },
  weekCalendar: {
    alignSelf: 'center',
  },
  formCard: {
    width: 364,
    borderRadius: 16,
    backgroundColor: '#F3F7FB',
    padding: 14,
    marginTop: 8,
  },
  formTitle: {
    color: HowlColors.gray_80,
    fontSize: 16,
    fontFamily: 'NunitoSans-Bold',
    marginBottom: 10,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#C6D1DD',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: HowlColors.gray_80,
    fontFamily: 'NunitoSans-Regular',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  formTextarea: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  mediaLabel: {
    color: HowlColors.gray_80,
    fontFamily: 'NunitoSans-SemiBold',
    fontSize: 14,
    marginBottom: 8,
  },
  mediaSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  mediaChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#A9B9CA',
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  mediaChipActive: {
    backgroundColor: '#294A68',
    borderColor: '#294A68',
  },
  mediaChipText: {
    color: '#294A68',
    fontFamily: 'NunitoSans-SemiBold',
    fontSize: 13,
  },
  mediaChipTextActive: {
    color: '#FFFFFF',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#E6EDF4',
    marginBottom: 12,
  },
  formSubmitButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: HowlColors.gray_80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSubmitButtonText: {
    color: '#FFFFFF',
    fontFamily: 'NunitoSans-Bold',
    fontSize: 15,
  },
  formMessage: {
    marginTop: 8,
    fontSize: 13,
    color: '#294A68',
    fontFamily: 'NunitoSans-SemiBold',
    textAlign: 'center',
  },
  reflectionItem: {
    borderTopWidth: 1,
    borderTopColor: '#D1DAE5',
    paddingTop: 10,
    marginTop: 10,
  },
  reflectionNotes: {
    color: HowlColors.gray_80,
    fontSize: 14,
    fontFamily: 'NunitoSans-Regular',
    marginBottom: 8,
  },
  infoText: {
    color: '#F3F7FB',
    fontSize: 14,
    fontFamily: 'NunitoSans-SemiBold',
    textAlign: 'center',
    marginTop: 8,
  },
  signInContainer: {
    alignItems: 'center',
    gap: 20,
  },
  signInButton: {
    width: 364,
    height: 60,
  },
  signOutButton: {
    width: 364,
    height: 60,
    marginTop: 16,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'NunitoSans-Bold',
    textAlign: 'center',
  },
  errorBadge: {
    marginTop: 20,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '100%',
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'NunitoSans-SemiBold',
    fontWeight: 'normal',
    fontSize: 14,
    lineHeight: 20,
  },
});
