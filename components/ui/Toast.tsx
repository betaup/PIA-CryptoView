import { Colors } from '@/constants/theme';
import { useToast } from '@/context/ToastContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Toast() {
    const { visible, message, type } = useToast();
    const { colorScheme } = useColorScheme();
    const insets = useSafeAreaInsets();

    if (!visible || !message) return null;

    const isDark = colorScheme === 'dark';
    const backgroundColor = isDark ? '#333' : '#fff';
    const textColor = isDark ? '#fff' : '#000';

    let iconName: keyof typeof Ionicons.glyphMap = 'information-circle';
    let iconColor = Colors[colorScheme ?? 'light'].tint;

    if (type === 'success') {
        iconName = 'checkmark-circle';
        iconColor = '#4CAF50';
    } else if (type === 'error') {
        iconName = 'alert-circle';
        iconColor = '#F44336';
    }

    return (
        <Animated.View
            entering={FadeInUp.springify()}
            exiting={FadeOutUp}
            style={[
                styles.container,
                {
                    top: insets.top + 10,
                    backgroundColor,
                    shadowColor: isDark ? '#000' : '#ccc',
                }
            ]}
        >
            <Ionicons name={iconName} size={24} color={iconColor} />
            <Text style={[styles.text, { color: textColor }]}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        zIndex: 1000,
        elevation: 5,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
});
