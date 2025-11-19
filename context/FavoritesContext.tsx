import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useEffect, useState } from 'react';

const FAVORITES_KEY = '@cryptoapp_favorites';

interface FavoritesContextType {
    favorites: string[];
    loading: boolean;
    toggleFavorite: (coinId: string) => Promise<void>;
    isFavorite: (coinId: string) => boolean;
}

export const FavoritesContext = createContext<FavoritesContextType>({
    favorites: [],
    loading: true,
    toggleFavorite: async () => { },
    isFavorite: () => false,
});

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
    const [favorites, setFavorites] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Cargar favoritos al iniciar
    useEffect(() => {
        const loadFavorites = async () => {
            try {
                const storedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
                if (storedFavorites) {
                    setFavorites(JSON.parse(storedFavorites));
                }
            } catch (error) {
                console.error('Error loading favorites:', error);
            } finally {
                setLoading(false);
            }
        };

        loadFavorites();
    }, []);

    const toggleFavorite = useCallback(async (coinId: string) => {
        try {
            const exists = favorites.includes(coinId);

            const newFavorites = exists
                ? favorites.filter((id) => id !== coinId)
                : [...favorites, coinId];

            setFavorites(newFavorites);

            // Guardar en AsyncStorage
            AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites)).catch((error) => {
                console.error('Error saving favorite:', error);
            });
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    }, [favorites]);

    const isFavorite = useCallback((coinId: string) => {
        return favorites.includes(coinId);
    }, [favorites]);

    return (
        <FavoritesContext.Provider value={{ favorites, loading, toggleFavorite, isFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
};
