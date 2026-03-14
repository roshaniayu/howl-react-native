import { HowlColors } from '@/constants/theme';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

const subtitle = 'Today, Howl has softly sent you to a sweet slumber for a total of';
const quote = 'The sun showed up again. So I looked up and asked it: ‘Why?’\nThe sun looked down, and brightly whispered: ‘To give you another try.’\n- Brad Montague';

function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;

  if (mins > 0) {
    if (secs > 0) {
      return `${mins} mins ${secs} secs`;
    }

    return `${mins} mins`;
  }

  return `${secs} secs`;
}

export default function ModalScreen() {
  const router = useRouter();
  const { playedSeconds } = useLocalSearchParams<{ playedSeconds?: string }>();
  const parsedSeconds = Number(playedSeconds ?? '0');
  const safePlayedSeconds = Number.isFinite(parsedSeconds) ? Math.max(0, parsedSeconds) : 0;
  const playedDurationText = useMemo(() => formatDuration(safePlayedSeconds), [safePlayedSeconds]);

  const closeModal = () => {
    router.back();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.7) {
          closeModal();
        }
      },
    })
  ).current;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={closeModal} />
      <View style={styles.sheet} {...panResponder.panHandlers}>
        <View style={styles.headerSection}>
          <Pressable style={styles.closeButton} onPress={closeModal}>
            <Image source={require('@/assets/icons/icon-close.png')} style={styles.closeIcon} contentFit="contain" />
          </Pressable>

          <Text style={styles.title}>Session Finished</Text>
        </View>

        <View style={styles.middleSection}>
          <Text style={styles.duration}>
            {subtitle}{' '}
            <Text style={styles.durationBold}>{playedDurationText}</Text>
          </Text>
          <View style={styles.quoteSection}>
            <Text style={styles.quoteSymbol}>"</Text>
            <Text style={styles.quote}>{quote}</Text>
          </View>
        </View>

        <View style={styles.footerSection}>
          <Pressable style={styles.doneButton} onPress={closeModal}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    height: '90%',
    width: '100%',
    backgroundColor: HowlColors.blue_100,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
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
  duration: {
    marginTop: 16,
    fontFamily: 'NunitoSans-Medium',
    fontSize: 20,
    color: HowlColors.gray_80,
    textAlign: 'left',
  },
  durationBold: {
    fontFamily: 'NunitoSans-Bold',
  },
  quoteSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%',
    marginTop: 32,
  },
  quoteSymbol: {
    fontFamily: 'NunitoSans-ExtraBold',
    fontSize: 60,
    lineHeight: 60,
    color: HowlColors.gray_80,
    marginRight: 8,
  },
  quote: {
    flex: 1,
    fontFamily: 'NunitoSans-Medium',
    fontSize: 18,
    lineHeight: 24,
    color: HowlColors.gray_80,
    textAlign: 'left',
    paddingLeft: 4
  },
  doneButton: {
    width: '100%',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HowlColors.gray_80,
    marginBottom: 32,
  },
  doneButtonText: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 18,
    color: HowlColors.blue_100,
  },
});
