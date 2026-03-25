import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AuthContextValue = {
  user: FirebaseAuthTypes.User | null;
  initializing: boolean;
  error: string | null;
  signInWithGoogleAccount: () => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getFirebaseAuth = useCallback(() => {
    const app = getApp();
    return getAuth(app);
  }, []);

  useEffect(() => {
    if (!process.env.EXPO_PUBLIC_WEB_CLIENT_ID) {
      setError('Missing EXPO_PUBLIC_WEB_CLIENT_ID in .env');
      setInitializing(false);
      return;
    }

    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
      offlineAccess: true,
    });

    let unsubscribe: (() => void) | undefined;

    try {
      const auth = getFirebaseAuth();
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setInitializing(false);
      });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Failed to initialize Firebase Auth';
      setError(message);
      setInitializing(false);
    }

    return () => {
      unsubscribe?.();
    };
  }, [getFirebaseAuth]);

  const signInWithGoogleAccount = useCallback(async () => {
    setError(null);

    const auth = getFirebaseAuth();

    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      throw new Error('User cancelled the login flow');
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new Error('Google Sign-In did not return an idToken');
    }

    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);
  }, [getFirebaseAuth]);

  const signOutUser = useCallback(async () => {
    setError(null);

    const auth = getFirebaseAuth();
    await signOut(auth);
    await GoogleSignin.signOut();
  }, [getFirebaseAuth]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      error,
      signInWithGoogleAccount,
      signOutUser,
      clearError,
    }),
    [user, initializing, error, signInWithGoogleAccount, signOutUser, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
