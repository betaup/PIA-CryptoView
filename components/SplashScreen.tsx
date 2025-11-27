import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, View } from 'react-native';

interface SplashScreenProps {
    onFinish: () => void;
}

const { width } = Dimensions.get('window');

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const { colorScheme } = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Secuencia de animación
        Animated.sequence([
            // 1. Aparecer (Fade In + Scale Up)
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]),
            // 2. Mantener un momento
            Animated.delay(1500),
            // 3. Desaparecer (Fade Out)
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start(({ finished }) => {
            if (finished) {
                onFinish();
            }
        });
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}>
                <Image
                    source={require('@/assets/images/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={[styles.title, { color: colors.text }]}>CryptoView</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: width * 0.4,
        height: width * 0.4,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 1,
        fontFamily: 'serif', // Fuente elegante tipo serif
    },
});
