import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

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
