import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import 'react-native-reanimated';

import SplashScreen from '@/components/SplashScreen';
import { CoinProvider } from '@/context/CoinContext';
import { ConfirmationProvider } from '@/context/ConfirmationContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { AppThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const { colorScheme } = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="crypto-detail" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  if (isSplashVisible) {
    return (
      <AppThemeProvider>
        <SplashScreen onFinish={() => setIsSplashVisible(false)} />
      </AppThemeProvider>
    );
  }

  return (
    <AppThemeProvider>
      <ToastProvider>
        <ConfirmationProvider>
          <FavoritesProvider>
            <CoinProvider>
              <RootLayoutContent />
            </CoinProvider>
          </FavoritesProvider>
        </ConfirmationProvider>
      </ToastProvider>
    </AppThemeProvider>
  );
}
