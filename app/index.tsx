import { HowlColors } from '@/constants/theme';
import { Audio } from 'expo-av';
import { HorizontalPicker } from 'expo-horizontal-picker';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const durations = [
  { durationName: '5 mins', durationTime: 299 },
  { durationName: '10 mins', durationTime: 599 },
  { durationName: '15 mins', durationTime: 899 },
  { durationName: '30 mins', durationTime: 1799 },
  { durationName: '45 mins', durationTime: 2699 },
  { durationName: '1 hour', durationTime: 3599 },
] as const;

const TITLE = 'Sleep better';
const SUBTITLE = 'This soothing relaxing instrumental sound helps you deal with insomnia and fall asleep within minutes.';
const PLAYING_TITLE = 'Have a great sleep';
const PLAYING_SUBTITLE = 'Once upon a time, there was a...\ne... e.. zzzzzzzzz...';
const RING_SIZE = 96;
const RING_STROKE_WIDTH = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE_WIDTH) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const [selectedDuration, setSelectedDuration] = useState<(typeof durations)[number]>(durations[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const sceneryTranslateY = useRef(new Animated.Value(0)).current;
  const characterTranslateY = useRef(new Animated.Value(0)).current;
  const sceneryFloatLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const characterFloatLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const pickerItems = durations.map((duration) => ({
    label: duration.durationName,
    value: duration.durationTime,
  }));

  const countdownProgress =
    totalSeconds && remainingSeconds !== null
      ? Math.min(1, Math.max(0, (totalSeconds - remainingSeconds) / totalSeconds))
      : 0;
  const progressStrokeOffset = RING_CIRCUMFERENCE * (1 - countdownProgress);

  useEffect(() => {
    if (!isPlaying || remainingSeconds === null) {
      return;
    }

    const timerId = setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous === null || previous <= 1) {
          setIsPlaying(false);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [isPlaying, remainingSeconds]);

  useEffect(() => {
    const syncPlayback = async () => {
      try {
        if (!soundRef.current) {
          const { sound } = await Audio.Sound.createAsync(
            require('@/assets/audio/ambience-1-sound.m4a'),
            { isLooping: true, volume: 1 },
          );
          soundRef.current = sound;
        }

        if (!soundRef.current) {
          return;
        }

        if (isPlaying) {
          await soundRef.current.setIsLoopingAsync(true);
          await soundRef.current.replayAsync();
        } else {
          await soundRef.current.stopAsync();
        }
      } catch (error) {
        console.warn('Audio playback error', error);
      }
    };

    void syncPlayback();
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      const unloadSound = async () => {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      };

      void unloadSound();
    };
  }, []);

  useEffect(() => {
    const stopFloating = () => {
      sceneryFloatLoopRef.current?.stop();
      characterFloatLoopRef.current?.stop();
      sceneryFloatLoopRef.current = null;
      characterFloatLoopRef.current = null;

      Animated.parallel([
        Animated.timing(sceneryTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(characterTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    };

    if (!isPlaying) {
      stopFloating();
      return;
    }

    sceneryFloatLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(sceneryTranslateY, {
          toValue: -110,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sceneryTranslateY, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    characterFloatLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(characterTranslateY, {
          toValue: -100,
          duration: 4400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(characterTranslateY, {
          toValue: 0,
          duration: 3600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    sceneryFloatLoopRef.current.start();
    characterFloatLoopRef.current.start();

    return stopFloating;
  }, [isPlaying, characterTranslateY, sceneryTranslateY]);

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    const nextTotal = selectedDuration.durationTime + 1;
    setTotalSeconds(nextTotal);
    setRemainingSeconds(nextTotal);
    setIsPlaying(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.scene}>
        <Image
          source={require('@/assets/ambiences/backgrounds/sunset-background.png')}
          style={styles.sky}
          contentFit="cover"
        />
        <Animated.View
          style={[styles.sceneryFloatLayer, { transform: [{ translateY: sceneryTranslateY }] }]}
          pointerEvents="none">
          <Image
            source={require('@/assets/ambiences/backgrounds/ambience-1-bg.png')}
            style={styles.scenery}
            contentFit="cover"
          />
        </Animated.View>
        <Animated.View
          style={[styles.characterFloatLayer, { transform: [{ translateY: characterTranslateY }] }]}
          pointerEvents="none">
          <Image
            source={require('@/assets/ambiences/characters/ambience-1-char.png')}
            style={styles.character}
            contentFit="cover"
          />
        </Animated.View>
      </View>

      <View style={styles.content}>
        <View style={styles.headerBlock}>
          <Image
            source={require('@/assets/logo/howl-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />

          <Text style={styles.title}>{isPlaying ? PLAYING_TITLE : TITLE}</Text>
          <Text style={styles.subtitle}>
            {isPlaying
              ? PLAYING_SUBTITLE
              : SUBTITLE}
          </Text>

          {isPlaying ? (
            <View style={styles.timerPill}>
              <Text style={styles.timerText}>{formatRemainingTime(remainingSeconds ?? 0)}</Text>
            </View>
          ) : (
            <View style={styles.durationPickerShell}>
              <HorizontalPicker
                items={pickerItems}
                initialScrollIndex={0}
                visibleItemCount={3}
                onChange={(value, index) => {
                  const clampedIndex = Math.max(0, Math.min(index, durations.length - 1));
                  const fromIndex = durations[clampedIndex];
                  const fromValue = durations.find((duration) => duration.durationTime === value);

                  if (fromValue) {
                    setSelectedDuration(fromValue);
                  } else if (fromIndex) {
                    setSelectedDuration(fromIndex);
                  }
                }}
                focusedTransformStyle={[{ scale: 1.1 }]}
                unfocusedTransformStyle={[{ scale: 0.9 }]}
                focusedOpacityStyle={1}
                unfocusedOpacityStyle={0.4}
                pickerItemStyle={styles.durationOption}
                pickerItemTextStyle={styles.durationText}
                style={styles.durationPicker}
              />
            </View>
          )}
        </View>

        <View style={styles.controls}>
          <Pressable style={styles.iconButton}>
            <Image
              source={require('@/assets/icons/icon-history.png')}
              style={styles.sideControlIcon}
              contentFit="contain"
            />
          </Pressable>

          <Pressable
            style={styles.playButton}
            onPress={handlePlayToggle}
            accessibilityState={{ selected: isPlaying }}>
            <View style={styles.playButtonWrap}>
              {isPlaying && (
                <View pointerEvents="none" style={styles.progressRingContainer}>
                  <Svg width={RING_SIZE} height={RING_SIZE}>
                    <Circle
                      cx={RING_SIZE / 2}
                      cy={RING_SIZE / 2}
                      r={RING_RADIUS}
                      stroke="rgba(255, 255, 255, 0.18)"
                      strokeWidth={RING_STROKE_WIDTH}
                      fill="none"
                    />
                    <Circle
                      cx={RING_SIZE / 2}
                      cy={RING_SIZE / 2}
                      r={RING_RADIUS}
                      stroke={HowlColors.gray_80}
                      strokeWidth={RING_STROKE_WIDTH}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                      strokeDashoffset={progressStrokeOffset}
                      transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                    />
                  </Svg>
                </View>
              )}
              <Image
                source={
                  isPlaying
                    ? require('@/assets/icons/icon-stop.png')
                    : require('@/assets/icons/icon-play.png')
                }
                style={styles.playControlIcon}
                contentFit="contain"
              />
            </View>
          </Pressable>

          <Pressable style={styles.iconButton}>
            <Image
              source={require('@/assets/icons/icon-ambiance.png')}
              style={styles.sideControlIcon}
              contentFit="contain"
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HowlColors.dark_blue,
  },
  scene: {
    ...StyleSheet.absoluteFillObject,
  },
  sky: {
    ...StyleSheet.absoluteFillObject,
  },
  sceneryFloatLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -240,
    height: '70%',
  },
  scenery: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
  },
  characterFloatLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -260,
    height: '60%',
  },
  character: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    paddingTop: 84,
    paddingBottom: 48,
  },
  headerBlock: {
    alignItems: 'center',
    marginTop: 24,
  },
  logo: {
    width: 58,
    height: 58,
  },
  title: {
    color: HowlColors.white,
    fontFamily: 'NunitoSans-Bold',
    fontSize: 24,
    letterSpacing: 0.2,
    marginTop: 28,
    marginBottom: 16,
  },
  subtitle: {
    color: HowlColors.gray_80,
    fontFamily: 'NunitoSans-Regular',
    fontSize: 18,
    letterSpacing: 0.2,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 28,
  },
  durationPickerShell: {
    position: 'relative',
    width: '70%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    overflow: 'hidden',
    fontFamily: 'NunitoSans-Regular',
  },
  durationPicker: {
    width: '100%',
  },
  durationOption: {
    width: 82,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    fontFamily: 'NunitoSans-Regular',
  },
  durationText: {
    color: HowlColors.gray_80,
    fontSize: 17,
    fontFamily: 'NunitoSans-Regular',
  },
  timerPill: {
    borderRadius: 999,
    backgroundColor: HowlColors.gray_80,
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  timerText: {
    color: HowlColors.blue_70,
    fontFamily: 'NunitoSans-Medium',
    fontSize: 20,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 4,
  },
  iconButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonWrap: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingContainer: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideControlIcon: {
    width: 32,
    height: 32,
  },
  playControlIcon: {
    width: 60,
    height: 60,
  },
});