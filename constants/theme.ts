/**
 * Aqui estan los colores que usa la aplicacion. Estan definidos para modo claro y oscuro.
 * Hay muchas formas de dar estilo a tu app, como Nativewind, Tamagui, etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#2C3E50', // Gris oscuro para que se lea bien
    textSecondary: '#89A8B2', // Azul principal
    background: '#F1F0E8', // Claro
    card: '#E5E1DA', // Beige o gris
    tint: '#89A8B2', // Primary Blue
    icon: '#B3C8CF', // Azul claro
    tabIconDefault: '#B3C8CF',
    tabIconSelected: '#89A8B2',
    border: '#B3C8CF',
    chartPositive: '#89A8B2',
    chartNegative: '#E07A5F', // Naranja o rojo suave (Complementario)
  },
  dark: {
    text: '#F1F0E8', // Claro
    textSecondary: '#B3C8CF', // Azul claro
    background: '#1A1A1A', // Oscuro
    card: '#2C2C2C', // Tarjeta oscura
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
    /** Fuente por defecto de iOS */
    sans: 'system-ui',
    /** Fuente serif de iOS */
    serif: 'ui-serif',
    /** Fuente redondeada de iOS */
    rounded: 'ui-rounded',
    /** Fuente monoespaciada de iOS */
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
