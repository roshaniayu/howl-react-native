import { Modal } from '@/components/ui/modal';
import { HowlColors } from '@/constants/theme';
import {
  GoogleSignin,
  GoogleSigninButton,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
  type SignInSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';

export default function SessionHistoryScreen() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<SignInSuccessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        setUserInfo(response);
        setError(null);

        // If you are using Firebase, you would pass response.data.idToken to Firebase here.
      } else {
        setUserInfo(null);
        setError('User cancelled the login flow');
      }
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

  useEffect(() => {
    if (!process.env.EXPO_PUBLIC_WEB_CLIENT_ID) {
      setError('Missing EXPO_PUBLIC_WEB_CLIENT_ID in .env');
      return;
    }

    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
      offlineAccess: true, // Required if you need a refresh token
    });
  }, []);

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      setUserInfo(null);
    } catch (error) {
      setError(`Something went wrong: ${error}`);
    }
  };

  const closeModal = () => {
    router.back();
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
        <View style={styles.middleSection}>
          {userInfo ? (
            <View style={styles.profileContainer}>
              <Text>Welcome, {userInfo.data.user.name}</Text>
              <Text>Email: {userInfo.data.user.email}</Text>
              <Button title="Sign Out" onPress={signOut} color="red" />

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
        </View>
      }
      footerSection={
        <View style={styles.footerSection}>
        </View>
      }
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
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
    marginBottom: 20,
  },
  profileContainer: {
    alignItems: 'center',
    gap: 15
  },
  signInContainer: {
    alignItems: 'center',
  },
  signInButton: {
    width: 364,
    height: 60
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
  }
});
