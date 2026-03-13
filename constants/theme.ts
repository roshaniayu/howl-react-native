/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const HowlColors = {
  white: '#FFFFFF',
  gray_80: '#D0D2CD',
  gray_100: '#ADB0A7',
  blue_70: '#45789C',
  blue_100: '#26435E',
  dark_blue: '#0F1E2B',
} as const;

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'NunitoSans-Regular',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    rounded: 'NunitoSans-Regular',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'NunitoSans-Regular',
    serif: 'serif',
    rounded: 'NunitoSans-Regular',
    mono: 'monospace',
  },
  web: {
    sans: "'Nunito Sans', system-ui, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'Nunito Sans', system-ui, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
