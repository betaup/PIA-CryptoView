import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

interface ProgressiveBlurProps {
    height?: number | string;
    position?: 'top' | 'bottom';
    style?: ViewStyle;
    intensity?: number; // No se usa para el degradado pero se mantiene por compatibilidad
}

export function ProgressiveBlur({ height = 100, position = 'bottom', style }: ProgressiveBlurProps) {
    const { colorScheme } = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const backgroundColor = colors.background;

    // Crea un degradado de transparente al color de fondo
    const gradientColors = (position === 'bottom'
        ? ['transparent', backgroundColor]
        : [backgroundColor, 'transparent']) as [string, string];

    return (
        <LinearGradient
            colors={gradientColors}
            style={[
                styles.container,
                { height: typeof height === 'number' ? height : undefined },
                position === 'bottom' ? { bottom: 0 } : { top: 0 },
                typeof height === 'string' ? { height } : {},
                style
            ] as any}
            pointerEvents="none"
        />
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 10,
    },
});
