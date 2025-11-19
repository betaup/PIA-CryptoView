import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { ColorSchemeName, useColorScheme as useDeviceColorScheme } from 'react-native';

const THEME_STORAGE_KEY = '@app_theme';

type ThemeMode = 'light' | 'dark' | 'system';

export const useColorScheme = () => {
    const deviceColorScheme = useDeviceColorScheme();
    const [themeMode, setThemeMode] = useState<ThemeMode>('system');
    const [isLoading, setIsLoading] = useState(true);

    // Cargar tema guardado
    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (stored) {
                setThemeMode(stored as ThemeMode);
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTheme = useCallback(async () => {
        const newMode: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
        setThemeMode(newMode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }, [themeMode]);

    const setTheme = useCallback(async (mode: ThemeMode) => {
        setThemeMode(mode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }, []);

    // Determinar el esquema de color actual
    const currentScheme: ColorSchemeName =
        themeMode === 'system' ? deviceColorScheme : themeMode;

    return {
        colorScheme: currentScheme,
        themeMode,
        toggleTheme,
        setTheme,
        isLoading,
    };
};
