import { useConfirmation } from '@/context/ConfirmationContext';
import { useToast } from '@/context/ToastContext';
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
    const { showToast } = useToast();
    const { showConfirmation } = useConfirmation();

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

    const saveFavorites = async (newFavorites: string[]) => {
        setFavorites(newFavorites);
        try {
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
        } catch (error) {
            console.error('Error saving favorite:', error);
        }
    };

    const toggleFavorite = useCallback(async (coinId: string) => {
        try {
            const exists = favorites.includes(coinId);

            if (exists) {
                // Si ya existe, pedir confirmación para eliminar
                showConfirmation({
                    title: 'Eliminar de Favoritos',
                    message: '¿Estás seguro de que quieres eliminar esta criptomoneda de tus favoritos?',
                    confirmText: 'Eliminar',
                    cancelText: 'Conservar',
                    onConfirm: () => {
                        const newFavorites = favorites.filter((id) => id !== coinId);
                        saveFavorites(newFavorites);
                        showToast('Eliminado de favoritos', 'info');
                    },
                });
            } else {
                // Si no existe, agregar directamente
                const newFavorites = [...favorites, coinId];
                saveFavorites(newFavorites);
                showToast('Agregado a favoritos', 'success');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showToast('Error al actualizar favoritos', 'error');
        }
    }, [favorites, showConfirmation, showToast]);

    const isFavorite = useCallback((coinId: string) => {
        return favorites.includes(coinId);
    }, [favorites]);

    return (
        <FavoritesContext.Provider value={{ favorites, loading, toggleFavorite, isFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
};
