/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#C5705D', // Terracotta for primary text/accents
    textSecondary: '#D0B8A8', // Darker Beige for secondary text
    background: '#F8EDE3', // Light Beige
    card: '#DFD3C3', // Beige
    tint: '#C5705D', // Terracotta
    icon: '#D0B8A8', // Darker Beige
    tabIconDefault: '#D0B8A8',
    tabIconSelected: '#C5705D',
    border: '#D0B8A8',
  },
  dark: {
    text: '#F8EDE3', // Light Beige for text on dark
    textSecondary: '#D0B8A8',
    background: '#1A1A1A', // Dark Grey/Brown
    card: '#2C2C2C', // Slightly lighter dark
    tint: '#C5705D', // Terracotta (keeps identity)
    icon: '#A0A0A0',
    tabIconDefault: '#666666',
    tabIconSelected: '#C5705D',
    border: '#444444',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
