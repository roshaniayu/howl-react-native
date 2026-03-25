import { Modal } from '@/components/ui/modal';
import { AMBIENCE_OPTIONS, AmbienceId, parseAmbienceId } from '@/constants/ambiences';
import { HowlColors } from '@/constants/theme';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function SetAmbienceScreen() {
  const router = useRouter();
  const { ambienceId } = useLocalSearchParams<{ ambienceId?: string }>();

  const initialAmbienceId = useMemo(() => parseAmbienceId(ambienceId) ?? 1, [ambienceId]);
  const [selectedAmbienceId, setSelectedAmbienceId] = useState<AmbienceId>(initialAmbienceId);
  const selectedAmbience = AMBIENCE_OPTIONS.find((ambience) => ambience.id === selectedAmbienceId) ?? AMBIENCE_OPTIONS[0];

  const closeModal = () => {
    router.back();
  };

  const saveSelection = () => {
    router.replace({
      pathname: '/',
      params: {
        ambienceId: String(selectedAmbienceId),
      },
    });
  };

  return (
    <Modal
      onClose={closeModal}
      backgroundSection={
        <Image
          source={require('@/assets/ambiences/backgrounds/sunset-background-2.png')}
          style={styles.skyBackground}
          contentFit="cover"
        />
      }
      titleSection={
        <View style={styles.headerSection}>
          <Pressable style={styles.closeButton} onPress={closeModal}>
            <Image source={require('@/assets/icons/icon-close.png')} style={styles.closeIcon} contentFit="contain" />
          </Pressable>

          <Text style={styles.title}>Set Ambience</Text>

          <Pressable style={styles.saveButton} onPress={saveSelection}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
      }
      contentSection={
        <View style={styles.contentSection}>
          <View style={styles.listSection}>
            {AMBIENCE_OPTIONS.map((ambience) => {
              const isSelected = ambience.id === selectedAmbienceId;

              return (
                <Pressable
                  key={ambience.id}
                  style={styles.ambienceRow}
                  onPress={() => setSelectedAmbienceId(ambience.id)}>
                  <Text style={styles.ambienceLabel}>{ambience.title}</Text>
                  {isSelected ? (
                    <View style={styles.checkBadge}>
                      <Image
                        source={require('@/assets/icons/icon-check.png')}
                        style={styles.checkIcon}
                        contentFit="contain"
                      />
                    </View>
                  ) : (
                    <View style={styles.checkBadgePlaceholder} />
                  )}
                </Pressable>
              );
            })}
          </View>

          <View pointerEvents="none" style={styles.previewScene}>
            <Image
              source={selectedAmbience.bgImage}
              style={[
                styles.previewBackground,
                {
                  height: selectedAmbience.visuals.setAmbience.backgroundHeight,
                  bottom: selectedAmbience.visuals.setAmbience.backgroundBottom,
                },
              ]}
              contentFit="cover"
              contentPosition="top"
            />
            <Image
              source={selectedAmbience.charImage}
              style={[
                styles.previewCharacter,
                {
                  height: selectedAmbience.visuals.setAmbience.characterHeight,
                  bottom: selectedAmbience.visuals.setAmbience.characterBottom,
                  transform: [{ translateX: selectedAmbience.visuals.setAmbience.characterTranslateX }],
                },
              ]}
              contentFit="cover"
              contentPosition="top"
            />
          </View>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  skyBackground: {
    width: '100%',
    height: '100%'
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  closeIcon: {
    width: 20,
    height: 24,
  },
  backIcon: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 26,
    lineHeight: 26,
    color: HowlColors.gray_80,
  },
  title: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 24,
    color: HowlColors.gray_80,
    textAlign: 'center',
  },
  saveButton: {
    minWidth: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  saveText: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 18,
    color: HowlColors.gray_80,
  },
  contentSection: {
    flex: 1,
  },
  listSection: {
    marginTop: 30,
  },
  ambienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 62,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 232, 231, 0.7)',
  },
  ambienceLabel: {
    fontFamily: 'NunitoSans-Medium',
    fontSize: 17,
    color: HowlColors.gray_80,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgePlaceholder: {
    width: 24,
    height: 24,
  },
  checkIcon: {
    width: 24,
    height: 24
  },
  previewScene: {
    flex: 1,
    justifyContent: 'flex-end',
    marginHorizontal: -24,
    marginBottom: -28,
  },
  previewBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
  },
  previewCharacter: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
  },
});
