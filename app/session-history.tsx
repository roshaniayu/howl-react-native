import { Modal } from '@/components/ui/modal';
import { HowlColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  fetchMarkedDateKeys,
  fetchReflectionsByDate as fetchReflectionsByDateFromDb,
  getLocalDateKey,
  getPlayedSoundStatusForDate,
  getPlayedTotalTimeForDate,
  saveReflectionForDate,
  type ReflectionDoc,
} from '@/services/reflections';
import { formatDuration } from '@/utils/time-format';
import { GoogleSigninButton, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { Image } from 'expo-image';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Modal as RNModal, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { CalendarProvider, WeekCalendar } from 'react-native-calendars';

const TARGET_IMAGE_BYTES = 500 * 1024;
const MAX_BASE64_FOR_FIRESTORE_CHARS = 900000;

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
  const [selectedDatePlayedSound, setSelectedDatePlayedSound] = useState(false);
  const [selectedDatePlayedTotalTime, setSelectedDatePlayedTotalTime] = useState(0);
  const [isLoadingReflections, setIsLoadingReflections] = useState(false);
  const [markedDateKeys, setMarkedDateKeys] = useState<string[]>([]);
  const [fullPhotoUri, setFullPhotoUri] = useState<string | null>(null);

  const todayKey = getLocalDateKey();
  const isSelectedToday = selectedDate === todayKey;
  const isEntryNotesEmpty = entryNotes.trim().length === 0;
  const calendarCardWidth = screenWidth - 40;
  const selectedDateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const fetchMarkedDates = useCallback(async () => {
    if (!user) {
      setMarkedDateKeys([]);
      return;
    }

    try {
      const keys = await fetchMarkedDateKeys(user.uid);
      setMarkedDateKeys(keys);
    } catch {
      setMarkedDateKeys([]);
    }
  }, [user]);

  const fetchReflectionsByDate = useCallback(async () => {
    if (!user) {
      setReflections([]);
      setSelectedDatePlayedSound(false);
      setSelectedDatePlayedTotalTime(0);
      return;
    }

    setIsLoadingReflections(true);
    try {
      const [rows, playedSound, playedTotalTime] = await Promise.all([
        fetchReflectionsByDateFromDb(user.uid, selectedDate),
        getPlayedSoundStatusForDate(user.uid, selectedDate),
        getPlayedTotalTimeForDate(user.uid, selectedDate),
      ]);
      setReflections(rows);
      setSelectedDatePlayedSound(playedSound);
      setSelectedDatePlayedTotalTime(playedTotalTime);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Failed to load reflections.';
      setFormMessage(message);
      setReflections([]);
      setSelectedDatePlayedSound(false);
      setSelectedDatePlayedTotalTime(0);
    } finally {
      setIsLoadingReflections(false);
    }
  }, [selectedDate, user]);

  const markedDates = markedDateKeys.reduce<Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string; selectedDotColor?: string }>>(
    (accumulator, dateKey) => {
      accumulator[dateKey] = {
        marked: true,
      };
      return accumulator;
    },
    {},
  );

  markedDates[selectedDate] = {
    ...markedDates[selectedDate],
    selected: true,
    selectedColor: HowlColors.white,
    dotColor: HowlColors.blue_100,
  };

  const weekCalendarTheme: any = {
    calendarBackground: 'transparent',
    textSectionTitleColor: HowlColors.gray_80,
    selectedDayBackgroundColor: HowlColors.white,
    selectedDayTextColor: HowlColors.blue_100,
    todayTextColor: HowlColors.gray_80,
    dayTextColor: HowlColors.gray_80,
    textDisabledColor: HowlColors.dark_blue,
    monthTextColor: HowlColors.gray_80,
    arrowColor: HowlColors.gray_80,
    dotColor: HowlColors.gray_80,
    todayDotColor: HowlColors.gray_80,
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
      await saveReflectionForDate({
        userId: user.uid,
        userEmail: user.email ?? null,
        notes: entryNotes.trim(),
        dateKey: selectedDate,
        imageBase64: imageBase64 ?? null,
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

  useEffect(() => {
    void fetchReflectionsByDate();
  }, [fetchReflectionsByDate]);

  useEffect(() => {
    void fetchMarkedDates();
  }, [fetchMarkedDates]);

  useEffect(() => {
    setError(authError);
  }, [authError]);

  return (
    <>
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
          <View style={styles.middleSection}>
            {initializing ? (
              <Text style={styles.subtitle}>Checking your saved session...</Text>
            ) : user ? (
              <View style={styles.sessionContainer}>
                <View style={styles.usernameContainer}>
                  <Text style={styles.welcomeText}>
                    Welcome, <Text style={styles.welcomeTextBold}>{user.displayName || user.email || 'User'}</Text>
                  </Text>
                  <Text style={styles.sessionText}>Email: {user.email || '-'}</Text>
                  <Pressable style={styles.signOutButton} onPress={signOut}>
                    <Text style={styles.signOutButtonText}>Sign Out</Text>
                  </Pressable>
                </View>
                <ScrollView
                  style={styles.scrollContainer}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={{ width: calendarCardWidth }}>
                    <Text style={styles.monthYearLabel}>{selectedDateLabel}</Text>
                    <CalendarProvider date={selectedDate} onDateChanged={setSelectedDate}>
                      <WeekCalendar
                        calendarWidth={calendarCardWidth}
                        style={[styles.weekCalendar, { width: calendarCardWidth }]}
                        firstDay={1}
                        maxDate={todayKey}
                        disableAllTouchEventsForDisabledDays
                        onDayPress={(day) => setSelectedDate(day.dateString)}
                        markedDates={markedDates}
                        theme={weekCalendarTheme}
                      />
                    </CalendarProvider>
                  </View>

                  <View style={styles.historyContainer}>
                    {isLoadingReflections ? (
                      <View style={styles.loadingContainer}>
                        <Text style={styles.sessionText}>Loading reflections...</Text>
                      </View>
                    ) : (
                      <View style={styles.historyContentContainer}>
                        {selectedDatePlayedSound ? (
                          <View style={styles.soundStatusContainer}>
                            <Image
                              source={require('@/assets/logo/howl-logo.png')}
                              style={styles.soundStatusLogo}
                              contentFit="contain"
                            />
                            <View style={styles.soundStatusTextContainer}>
                              <Text style={styles.soundStatusBoldText}>{isSelectedToday ? 'You have played sounds today.\n' : 'You played sounds on this date.\n'}
                                <Text style={styles.soundStatusText}>Total time played: </Text>{formatDuration(selectedDatePlayedTotalTime)}</Text>
                            </View>
                          </View>
                        ) : (
                          <Text style={styles.sessionText}>{isSelectedToday ? 'You have not played any sounds today.' : 'You did not play any sounds on this date.'}</Text>
                        )}

                        {
                          reflections.length > 0 ? (
                            <View style={styles.reflectionContainer}>
                              <Text style={styles.reflectionTitle}>Your Reflection</Text>
                              {reflections.map((reflection) => (
                                <View key={reflection.id} style={styles.reflectionItem}>
                                  {reflection.imageBase64 ? (
                                    <Pressable onPress={() => setFullPhotoUri(`data:image/jpeg;base64,${reflection.imageBase64}`)}>
                                      <Image
                                        source={{ uri: `data:image/jpeg;base64,${reflection.imageBase64}` }}
                                        style={styles.reflectionImage}
                                        contentFit="cover"
                                      />
                                    </Pressable>
                                  ) : null}
                                  <Text style={styles.reflectionNotes}>{reflection.notes}</Text>
                                </View>
                              ))}
                            </View>
                          ) : isSelectedToday ? (
                            <View style={styles.reflectionEntryContainer}>
                              <Text style={styles.reflectionEntryTitle}>How was your day?</Text>
                              <Text style={styles.reflectionEntrySubtitle}>Reflect on how your day went to ease your mind.</Text>
                              <View style={styles.reflectionEntryPhotoRow}>
                                <Text style={styles.reflectionEntryPhotoLabel}>Photo (Optional)</Text>
                                <View style={styles.reflectionEntryPhotoButtonRow}>
                                  <Pressable style={styles.reflectionEntryPhotoButton} onPress={openCameraMenu}>
                                    <Text style={styles.reflectionEntryPhotoButtonText}>
                                      {imageBase64 ? 'Change Photo' : 'Upload Photo'}
                                    </Text>
                                  </Pressable>
                                </View>
                              </View>

                              {imagePreviewUri ? (
                                <Pressable onPress={() => setFullPhotoUri(imagePreviewUri)}>
                                  <Image
                                    source={{ uri: imagePreviewUri }}
                                    style={styles.reflectionImage}
                                    contentFit="cover" />
                                </Pressable>
                              ) : null}

                              <TextInput
                                value={entryNotes}
                                onChangeText={setEntryNotes}
                                placeholder="Write your notes"
                                placeholderTextColor={HowlColors.gray_100}
                                multiline
                                style={[styles.reflectionEntryInput, styles.reflectionEntryTextarea]}
                              />

                              <Pressable
                                style={[
                                  styles.reflectionEntrySaveButton,
                                  (isSaving || isEntryNotesEmpty) && styles.reflectionEntrySaveButtonDisabled,
                                ]}
                                onPress={saveSessionEntry}
                                disabled={isSaving || isEntryNotesEmpty}
                              >
                                <Text
                                  style={[
                                    styles.reflectionEntrySaveButtonText,
                                    (isSaving || isEntryNotesEmpty) && styles.reflectionEntrySaveButtonTextDisabled,
                                  ]}
                                >
                                  {isSaving ? 'Saving...' : 'Save Reflection'}
                                </Text>
                              </Pressable>

                              {formMessage ? <Text style={styles.reflectionEntryMessage}>{formMessage}</Text> : null}
                            </View>
                          ) : (
                            <Text style={styles.sessionText}>You missed to reflect on this date :(</Text>
                          )}
                      </View>
                    )}
                  </View>
                </ScrollView>
              </ View>
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

          </View>
        }
        footerSection={< View style={styles.footerSection} />}
      />

      <RNModal
        visible={Boolean(fullPhotoUri)}
        transparent
        animationType="fade"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setFullPhotoUri(null)}
      >
        <Pressable style={styles.fullPhotoOverlay} onPress={() => setFullPhotoUri(null)}>
          {fullPhotoUri ? <Image source={{ uri: fullPhotoUri }} style={styles.fullPhotoImage} contentFit="contain" /> : null}
          <Text style={styles.fullPhotoHint}>Tap anywhere to close</Text>
        </Pressable>
      </RNModal>
    </>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    gap: 16,
  },
  usernameContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 2,
    width: '100%',
  },
  scrollContainer: {
    borderTopColor: HowlColors.gray_80,
    borderTopWidth: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 12,
    width: 364,
    paddingBottom: 32,
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
    paddingHorizontal: 20,
  },
  welcomeText: {
    color: HowlColors.gray_80,
    fontSize: 18,
    fontFamily: 'NunitoSans-Medium',
    fontWeight: 'normal',
    textAlign: 'center',
  },
  welcomeTextBold: {
    fontFamily: 'NunitoSans-Bold',
  },
  sessionText: {
    color: HowlColors.gray_80,
    fontSize: 16,
    fontFamily: 'NunitoSans-Regular',
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 10,
    borderRadius: 50,
    backgroundColor: HowlColors.gray_80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButtonText: {
    color: HowlColors.blue_100,
    fontSize: 16,
    fontFamily: 'NunitoSans-Bold',
    textAlign: 'center',
  },
  monthYearLabel: {
    color: HowlColors.gray_80,
    fontSize: 18,
    fontFamily: 'NunitoSans-Bold',
    textAlign: 'center',
  },
  weekCalendar: {
    alignSelf: 'center',
  },
  historyContainer: {
    borderTopColor: HowlColors.blue_70,
    borderTopWidth: 1,
    width: '100%',
    paddingTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyContentContainer: {
    alignItems: 'flex-start',
    width: '100%',
    gap: 16,
  },
  soundStatusContainer: {
    backgroundColor: HowlColors.blue_70,
    padding: 16,
    borderRadius: 10,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  soundStatusLogo: {
    width: 40,
    height: 40,
  },
  soundStatusTextContainer: {
    flex: 1,
  },
  soundStatusText: {
    color: HowlColors.white,
    fontSize: 16,
    fontFamily: 'NunitoSans-Medium',
  },
  soundStatusBoldText: {
    color: HowlColors.white,
    fontSize: 16,
    fontFamily: 'NunitoSans-Bold',
  },
  reflectionContainer: {
    padding: 16,
    backgroundColor: HowlColors.blue_70,
    borderRadius: 10,
    width: '100%',
    gap: 16
  },
  reflectionTitle: {
    fontSize: 18,
    fontFamily: 'NunitoSans-Bold',
    color: HowlColors.white,
  },
  reflectionItem: {
    borderTopWidth: 1,
    borderTopColor: HowlColors.gray_80,
    paddingTop: 16,
    gap: 16
  },
  reflectionImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: HowlColors.blue_70
  },
  reflectionNotes: {
    color: HowlColors.white,
    fontSize: 16,
    fontFamily: 'NunitoSans-Medium',
  },
  fullPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.80)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    zIndex: 20,
  },
  fullPhotoImage: {
    ...StyleSheet.absoluteFillObject,
  },
  fullPhotoHint: {
    position: 'absolute',
    bottom: 80,
    color: HowlColors.white,
    fontSize: 16,
    fontFamily: 'NunitoSans-Bold',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  reflectionEntryContainer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: HowlColors.blue_70,
    borderRadius: 10,
    width: '100%',
    gap: 16
  },
  reflectionEntryTitle: {
    color: HowlColors.white,
    fontSize: 18,
    fontFamily: 'NunitoSans-Bold',
  },
  reflectionEntrySubtitle: {
    color: HowlColors.white,
    fontSize: 16,
    fontFamily: 'NunitoSans-Medium',
    marginTop: -14,
  },
  reflectionEntryPhotoRow: {
    borderTopWidth: 1,
    borderTopColor: HowlColors.gray_80,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16
  },
  reflectionEntryPhotoLabel: {
    color: HowlColors.white,
    fontFamily: 'NunitoSans-Bold',
    fontSize: 16,
  },
  reflectionEntryPhotoButtonRow: {
    flexDirection: 'row',
    width: 140,
  },
  reflectionEntryPhotoButton: {
    flex: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: HowlColors.blue_100,
  },
  reflectionEntryPhotoButtonText: {
    color: HowlColors.white,
    fontFamily: 'NunitoSans-Bold',
    fontSize: 16,
  },
  reflectionEntryInput: {
    borderWidth: 1,
    borderColor: HowlColors.gray_80,
    borderRadius: 10,
    backgroundColor: HowlColors.white,
    color: HowlColors.dark_blue,
    fontFamily: 'NunitoSans-Regular',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reflectionEntryTextarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  reflectionEntrySaveButton: {
    height: 52,
    borderRadius: 99,
    backgroundColor: HowlColors.blue_100,
    alignItems: 'center',
    justifyContent: 'center'
  },
  reflectionEntrySaveButtonDisabled: {
    backgroundColor: HowlColors.gray_80,
  },
  reflectionEntrySaveButtonText: {
    color: HowlColors.white,
    fontFamily: 'NunitoSans-Bold',
    fontSize: 16,
  },
  reflectionEntrySaveButtonTextDisabled: {
    color: HowlColors.white,
  },
  reflectionEntryMessage: {
    marginTop: -8,
    fontSize: 14,
    color: HowlColors.gray_80,
    fontFamily: 'NunitoSans-Medium',
    textAlign: 'center',
  },
  signInContainer: {
    alignItems: 'center',
    gap: 20,
  },
  signInButton: {
    width: 364,
    height: 60,
  },
  errorBadge: {
    marginTop: 20,
    backgroundColor: '#DC2626',
    borderRadius: 10,
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
  footerSection: {
    width: '100%',
  }
});
