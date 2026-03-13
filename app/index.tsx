import { HowlColors } from '@/constants/theme';
import { HorizontalPicker } from 'expo-horizontal-picker';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const durations = [
  { durationName: '5 mins', durationTime: 299 },
  { durationName: '10 mins', durationTime: 599 },
  { durationName: '15 mins', durationTime: 899 },
  { durationName: '30 mins', durationTime: 1799 },
  { durationName: '45 mins', durationTime: 2699 },
  { durationName: '1 hour', durationTime: 3599 },
] as const;

export default function HomeScreen() {
  const [selectedDuration, setSelectedDuration] = useState<(typeof durations)[number]>(durations[0]);

  const pickerItems = durations.map((duration) => ({
    label: duration.durationName,
    value: duration.durationTime,
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.scene}>
        <Image
          source={require('@/assets/ambiences/backgrounds/sunset-background.png')}
          style={styles.sky}
          contentFit="cover"
        />
        <Image
          source={require('@/assets/ambiences/backgrounds/ambience-1-bg.png')}
          style={styles.mountains}
          contentFit="cover"
        />
        <Image
          source={require('@/assets/ambiences/characters/ambience-1-char.png')}
          style={styles.character}
          contentFit="cover"
        />
      </View>

      <View style={styles.content}>
        <View style={styles.headerBlock}>
          <Image
            source={require('@/assets/logo/howl-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />

          <Text style={styles.title}>Sleep better</Text>
          <Text style={styles.subtitle}>
            This soothing relaxing instrumental sound helps you deal with insomnia and fall
            asleep within minutes.
          </Text>

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
        </View>

        <View style={styles.controls}>
          <Pressable style={styles.iconButton}>
            <Image
              source={require('@/assets/icons/icon-history.png')}
              style={styles.sideControlIcon}
              contentFit="contain"
            />
          </Pressable>

          <Pressable style={styles.playButton}>
            <Image
              source={require('@/assets/icons/icon-play.png')}
              style={styles.playControlIcon}
              contentFit="contain"
            />
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
  mountains: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -240,
    height: '70%',
    maxWidth: '100%',
  },
  character: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -260,
    height: '60%',
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
    fontSize: 22,
    letterSpacing: 0.2,
    marginTop: 28,
    marginBottom: 16,
  },
  subtitle: {
    color: HowlColors.gray_80,
    fontFamily: 'NunitoSans-Regular',
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 28,
  },
  durationPickerShell: {
    position: 'relative',
    width: '76%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    overflow: 'hidden',
    fontFamily: 'NunitoSans-Regular',
  },
  durationPicker: {
    width: '100%',
  },
  durationOption: {
    width: 90,
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
  sideControlIcon: {
    width: 32,
    height: 32,
  },
  playControlIcon: {
    width: 60,
    height: 60,
  },
});