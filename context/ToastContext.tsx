import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info';

interface ToastData {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ToastItem = ({ id, message, type, onHide }: { id: string, message: string, type: ToastType, onHide: (id: string) => void }) => {
    const { colorScheme } = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        // Entrada
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                speed: 12,
                bounciness: 8,
            }),
        ]).start();

        // Auto-cierre
        const timer = setTimeout(() => {
            handleHide();
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const handleHide = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: -20,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onHide(id);
        });
    };

    const getIconName = () => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'error': return 'alert-circle';
            default: return 'information-circle';
        }
    };

    const getBackgroundColor = () => {
        switch (type) {
            case 'success': return colors.tint;
            case 'error': return colors.chartNegative;
            default: return isDark ? colors.card : colors.text; // Oscuro en ambos modos para contraste con texto blanco
        }
    };

    return (
        <Animated.View
            style={[
                styles.toastItem,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY }],
                    backgroundColor: getBackgroundColor(),
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                },
            ]}>
            <Ionicons name={getIconName()} size={24} color="#FFFFFF" style={styles.icon} />
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <SafeAreaInsetsContext.Consumer>
                {(insets) => (
                    <View style={[styles.container, { top: (insets?.top || 0) + 10 }]}>
                        {toasts.map((toast) => (
                            <ToastItem
                                key={toast.id}
                                id={toast.id}
                                message={toast.message}
                                type={toast.type}
                                onHide={hideToast}
                            />
                        ))}
                    </View>
                )}
            </SafeAreaInsetsContext.Consumer>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20,
        right: 20,
        zIndex: 9999,
        gap: 10, // Espacio entre toasts
    },
    toastItem: {
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    icon: {
        marginRight: 12,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
});
