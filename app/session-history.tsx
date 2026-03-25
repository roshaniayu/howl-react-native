import { Modal } from '@/components/ui/modal';
import { HowlColors } from '@/constants/theme';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';

export default function SessionHistoryScreen() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const user = await GoogleSignin.signIn();

      setUserInfo(user);
      setError(null);

      // If you are using Firebase, you would pass user.idToken to Firebase here.
      console.log('User Info:', user);

    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        setError('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        setError('Sign in is currently in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services are not available');
      } else {
        setError(`Something went wrong: ${error.message}`);
      }
    }
  };

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '876549095772-93b3ti8mbh3errt3iqsr7cnvuc1p8iq7.apps.googleusercontent.com',
      offlineAccess: true, // Required if you need a refresh token
    });
  }, []);

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      setUserInfo(null);
    } catch (error) {
      console.error(error);
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
          <Text style={styles.subtitle}>Welcome to Howl</Text>

          {userInfo ? (
            <View style={styles.profileContainer}>
              <Text>Welcome, {userInfo.user.name}</Text>
              <Text>Email: {userInfo.user.email}</Text>
              <Button title="Sign Out" onPress={signOut} color="red" />
            </View>
          ) : (
            <GoogleSigninButton
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Dark}
              onPress={signIn}
            />
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30
  },
  profileContainer: {
    alignItems: 'center',
    gap: 15
  },
  errorText: {
    color: 'red',
    marginTop: 20,
    textAlign: 'center'
  }
});
