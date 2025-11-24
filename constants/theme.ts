/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#2C3E50', // Dark gray for readability
    textSecondary: '#89A8B2', // Primary Blue
    background: '#F1F0E8', // Lightest
    card: '#E5E1DA', // Beige/Gray
    tint: '#89A8B2', // Primary Blue
    icon: '#B3C8CF', // Light Blue
    tabIconDefault: '#B3C8CF',
    tabIconSelected: '#89A8B2',
    border: '#B3C8CF',
    chartPositive: '#89A8B2',
    chartNegative: '#E07A5F', // Muted Orange/Red (Complementary)
  },
  dark: {
    text: '#F1F0E8', // Lightest
    textSecondary: '#B3C8CF', // Light Blue
    background: '#1A1A1A', // Dark
    card: '#2C2C2C', // Dark Card
    tint: '#89A8B2', // Primary Blue
    icon: '#B3C8CF',
    tabIconDefault: '#666666',
    tabIconSelected: '#89A8B2',
    border: '#444444',
    chartPositive: '#89A8B2',
    chartNegative: '#E07A5F',
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
