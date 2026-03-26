import { getApp } from '@react-native-firebase/app';
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

export type ReflectionDoc = {
  id: string;
  notes: string;
  imageBase64: string | null;
  dateKey: string;
  playedSound: boolean;
};

type SaveReflectionInput = {
  userId: string;
  userEmail: string | null;
  dateKey: string;
  notes: string;
  imageBase64: string | null;
};

export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const fetchMarkedDateKeys = async (userId: string) => {
  const firestore = getFirestore(getApp());
  const reflectionsQuery = query(
    collection(firestore, 'reflections'),
    where('userId', '==', userId),
  );
  const playedSoundsQuery = query(
    collection(firestore, 'playedSounds'),
    where('userId', '==', userId),
  );

  const [reflectionSnapshot, playedSoundsSnapshot] = await Promise.all([
    getDocs(reflectionsQuery),
    getDocs(playedSoundsQuery),
  ]);
  const keys = new Set<string>();

  reflectionSnapshot.docs.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
    const data = doc.data() as { dateKey?: string };
    if (data.dateKey) {
      keys.add(data.dateKey);
    }
  });

  playedSoundsSnapshot.docs.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
    const data = doc.data() as { dateKey?: string };
    if (data.dateKey) {
      keys.add(data.dateKey);
    }
  });

  return Array.from(keys);
};

export const fetchReflectionsByDate = async (userId: string, dateKey: string): Promise<ReflectionDoc[]> => {
  const firestore = getFirestore(getApp());
  const reflectionsQuery = query(
    collection(firestore, 'reflections'),
    where('userId', '==', userId),
    where('dateKey', '==', dateKey),
  );

  const [snapshot, playedSound] = await Promise.all([
    getDocs(reflectionsQuery),
    getPlayedSoundStatusForDate(userId, dateKey),
  ]);

  return snapshot.docs.map((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
    const data = doc.data() as {
      notes?: string;
      imageBase64?: string | null;
      dateKey?: string;
    };

    return {
      id: doc.id,
      notes: data.notes ?? '',
      imageBase64: data.imageBase64 ?? null,
      dateKey: data.dateKey ?? dateKey,
      playedSound,
    };
  });
};

export const saveReflectionForDate = async ({
  userId,
  userEmail,
  dateKey,
  notes,
  imageBase64,
}: SaveReflectionInput) => {
  const firestore = getFirestore(getApp());
  const reflectionsQuery = query(
    collection(firestore, 'reflections'),
    where('userId', '==', userId),
    where('dateKey', '==', dateKey),
  );

  const snapshot = await getDocs(reflectionsQuery);

  if (!snapshot.empty) {
    const existingDoc = snapshot.docs[0];

    await updateDoc(existingDoc.ref, {
      userEmail,
      notes,
      imageBase64,
      mediaType: imageBase64 ? 'image' : null,
      updatedAt: serverTimestamp(),
    });

    return;
  }

  await addDoc(collection(firestore, 'reflections'), {
    userId,
    userEmail,
    notes,
    dateKey,
    mediaType: imageBase64 ? 'image' : null,
    imageBase64,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getPlayedSoundStatusForDate = async (userId: string, dateKey: string) => {
  const firestore = getFirestore(getApp());
  const playedSoundsQuery = query(
    collection(firestore, 'playedSounds'),
    where('userId', '==', userId),
    where('dateKey', '==', dateKey),
  );

  const snapshot = await getDocs(playedSoundsQuery);
  if (snapshot.empty) {
    return false;
  }

  const data = snapshot.docs[0].data() as { playedSound?: boolean };
  return data.playedSound === true;
};

export const getPlayedTotalTimeForDate = async (userId: string, dateKey: string) => {
  const firestore = getFirestore(getApp());
  const playedSoundsQuery = query(
    collection(firestore, 'playedSounds'),
    where('userId', '==', userId),
    where('dateKey', '==', dateKey),
  );

  const snapshot = await getDocs(playedSoundsQuery);
  if (snapshot.empty) {
    return 0;
  }

  const data = snapshot.docs[0].data() as { playedTotalTime?: number };
  return typeof data.playedTotalTime === 'number' && Number.isFinite(data.playedTotalTime)
    ? Math.max(0, Math.floor(data.playedTotalTime))
    : 0;
};

export const trackSoundPlayedForDate = async (userId: string, dateKey: string, userEmail: string | null = null) => {
  const firestore = getFirestore(getApp());
  const playedSoundsQuery = query(
    collection(firestore, 'playedSounds'),
    where('userId', '==', userId),
    where('dateKey', '==', dateKey),
  );

  const snapshot = await getDocs(playedSoundsQuery);
  if (snapshot.empty) {
    await addDoc(collection(firestore, 'playedSounds'), {
      userId,
      userEmail,
      dateKey,
      playedSound: true,
      playedTotalTime: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const existingDoc = snapshot.docs[0];
  const existingData = existingDoc.data() as { playedSound?: boolean };
  if (existingData.playedSound !== true) {
    await updateDoc(existingDoc.ref, {
      playedSound: true,
      userEmail,
      updatedAt: serverTimestamp(),
    });
  }
};

export const addPlayedTotalTimeForDate = async (
  userId: string,
  dateKey: string,
  playedSeconds: number,
  userEmail: string | null = null,
) => {
  const firestore = getFirestore(getApp());
  const normalizedSeconds = Math.max(0, Math.floor(playedSeconds));

  if (normalizedSeconds <= 0) {
    return;
  }

  const playedSoundsQuery = query(
    collection(firestore, 'playedSounds'),
    where('userId', '==', userId),
    where('dateKey', '==', dateKey),
  );

  const snapshot = await getDocs(playedSoundsQuery);

  if (snapshot.empty) {
    await addDoc(collection(firestore, 'playedSounds'), {
      userId,
      userEmail,
      dateKey,
      playedSound: true,
      playedTotalTime: normalizedSeconds,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const existingDoc = snapshot.docs[0];
  const existingData = existingDoc.data() as { playedTotalTime?: number };
  const previousTotal =
    typeof existingData.playedTotalTime === 'number' && Number.isFinite(existingData.playedTotalTime)
      ? Math.max(0, Math.floor(existingData.playedTotalTime))
      : 0;

  await updateDoc(existingDoc.ref, {
    userEmail,
    playedSound: true,
    playedTotalTime: previousTotal + normalizedSeconds,
    updatedAt: serverTimestamp(),
  });
};
