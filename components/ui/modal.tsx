import { ReactNode, useRef } from 'react';
import { DimensionValue, PanResponder, Pressable, StyleSheet, View } from 'react-native';

type ModalProps = {
  onClose: () => void;
  backgroundSection?: ReactNode;
  titleSection: ReactNode;
  contentSection: ReactNode;
  footerSection?: ReactNode;
  height?: DimensionValue;
  backgroundColor?: string;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  paddingHorizontal?: number;
  paddingTop?: number;
  paddingBottom?: number;
  allowBackdropDismiss?: boolean;
  allowDragToClose?: boolean;
  dragCloseDistance?: number;
};

export function Modal({
  onClose,
  backgroundSection,
  titleSection,
  contentSection,
  footerSection,
  height = '90%',
  backgroundColor,
  borderTopLeftRadius = 32,
  borderTopRightRadius = 32,
  paddingHorizontal = 24,
  paddingTop = 12,
  paddingBottom = 28,
  allowBackdropDismiss = true,
  allowDragToClose = true,
  dragCloseDistance = 80,
}: ModalProps) {
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => allowDragToClose && gestureState.dy > 10,
      onPanResponderRelease: (_, gestureState) => {
        if (!allowDragToClose) {
          return;
        }

        if (gestureState.dy > dragCloseDistance || gestureState.vy > 0.7) {
          onClose();
        }
      },
    })
  ).current;

  return (
    <View style={styles.overlay}>
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          if (allowBackdropDismiss) {
            onClose();
          }
        }}
      />

      <View
        style={[
          styles.sheet,
          {
            height,
            backgroundColor,
            borderTopLeftRadius,
            borderTopRightRadius,
            paddingHorizontal,
            paddingTop,
            paddingBottom,
          },
        ]}
        {...panResponder.panHandlers}>
        {backgroundSection ? <View style={styles.backgroundSection}>{backgroundSection}</View> : null}
        <View style={styles.headerSection}>{titleSection}</View>
        <View style={styles.contentSection}>{contentSection}</View>
        {footerSection ? <View style={styles.footerSection}>{footerSection}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    width: '100%',
    overflow: 'hidden',
  },
  backgroundSection: {
    ...StyleSheet.absoluteFillObject,
  },
  headerSection: {
    width: '100%',
  },
  contentSection: {
    flex: 1,
    width: '100%',
  },
  footerSection: {
    width: '100%',
  },
});
