import { Modal } from '@/components/ui/modal';
import { HowlColors } from '@/constants/theme';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const subtitle = 'Today, Howl has softly sent you to a sweet slumber for a total of';
const quotePart1 = 'The sun showed up again. So I looked up and asked it: ';
const quoteBold1 = '‘Why?’';
const quotePart2 = 'The sun looked down, and brightly whispered: ';
const quoteBold2 = '‘To give you another try.’';
const quotePart3 = '- Brad Montague';

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

  return (
    <Modal
      onClose={closeModal}
      backgroundColor={HowlColors.blue_100}
      titleSection={
        <View style={styles.headerSection}>
          <Pressable style={styles.closeButton} onPress={closeModal}>
            <Image source={require('@/assets/icons/icon-close.png')} style={styles.closeIcon} contentFit="contain" />
          </Pressable>

          <Text style={styles.title}>Session Finished</Text>
        </View>
      }
      contentSection={
        <View style={styles.middleSection}>
          <Text style={styles.duration}>
            {subtitle}{' '}
            <Text style={styles.durationBold}>{playedDurationText}</Text>
          </Text>
          <View style={styles.quoteSection}>
            <Text style={styles.quoteSymbol}>"</Text>
            <View style={styles.quoteTextBlock}>
              <Text style={styles.quote}>
                {quotePart1}
                <Text style={styles.quoteBold}>{quoteBold1}</Text>
              </Text>
              <Text style={[styles.quote, styles.quoteSpace]}>
                {quotePart2}
                <Text style={styles.quoteBold}>{quoteBold2}</Text>
              </Text>
              <Text style={[styles.quote, styles.quoteSpace]}>
                {quotePart3}
              </Text>
            </View>
          </View>
        </View>
      }
      footerSection={
        <View style={styles.footerSection}>
          <Pressable style={styles.doneButton} onPress={closeModal}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
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
  quoteTextBlock: {
    flex: 1,
  },
  quote: {
    fontFamily: 'NunitoSans-Medium',
    fontSize: 17,
    lineHeight: 24,
    color: HowlColors.gray_80,
    textAlign: 'left',
    paddingLeft: 4
  },
  quoteBold: {
    fontFamily: 'NunitoSans-Bold',
  },
  quoteSpace: {
    marginTop: 12,
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
