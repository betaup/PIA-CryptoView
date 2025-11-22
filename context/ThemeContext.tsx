import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { ColorSchemeName, useColorScheme as useDeviceColorScheme } from 'react-native';

const THEME_STORAGE_KEY = '@app_theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    colorScheme: ColorSchemeName;
    themeMode: ThemeMode;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
    isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    colorScheme: 'light',
    themeMode: 'system',
    toggleTheme: () => { },
    setTheme: () => { },
    isLoading: true,
});

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
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
        setThemeMode((prev) => {
            const newMode = prev === 'dark' ? 'light' : 'dark';
            AsyncStorage.setItem(THEME_STORAGE_KEY, newMode).catch(console.error);
            return newMode;
        });
    }, []);

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

    return (
        <ThemeContext.Provider value={{ colorScheme: currentScheme, themeMode, toggleTheme, setTheme, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
