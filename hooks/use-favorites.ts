import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const FAVORITES_KEY = '@cryptoapp_favorites';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar favoritos al iniciar
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = useCallback(async (coinId: string) => {
    try {
      const newFavorites = favorites.includes(coinId)
        ? favorites.filter((id) => id !== coinId)
        : [...favorites, coinId];
      
      setFavorites(newFavorites);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorite:', error);
    }
  }, [favorites]);

  const isFavorite = useCallback((coinId: string) => {
    return favorites.includes(coinId);
  }, [favorites]);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
  };
};

