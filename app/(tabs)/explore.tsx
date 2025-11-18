import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFavorites } from '@/hooks/use-favorites';
import { formatPercentage, formatPrice } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Tipo para los datos de criptomoneda
interface CryptoCoin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
  image: string;
}

type Currency = 'usd' | 'mxn' | 'eur';

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { favorites, loading: favoritesLoading, toggleFavorite, isFavorite } = useFavorites();

  // Estados
  const [favoriteCoins, setFavoriteCoins] = useState<CryptoCoin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>('usd');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Función para obtener datos de las criptomonedas favoritas
  const fetchFavoriteCoins = useCallback(async (vsCurrency: Currency = 'usd') => {
    if (favorites.length === 0) {
      setFavoriteCoins([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      const ids = favorites.join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vsCurrency}&ids=${ids}&order=market_cap_desc&sparkline=false`
      );

      if (!response.ok) {
        throw new Error('Error al obtener los datos');
      }

      const data = await response.json();
      // Mantener el orden de favoritos
      const orderedData = favorites
        .map((id) => data.find((coin: CryptoCoin) => coin.id === id))
        .filter((coin) => coin !== undefined);
      setFavoriteCoins(orderedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching favorite coins:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [favorites]);

  // Cargar datos cuando cambian los favoritos o la moneda
  useEffect(() => {
    if (!favoritesLoading) {
      fetchFavoriteCoins(currency);
    }
  }, [favorites, currency, favoritesLoading, fetchFavoriteCoins]);

  // Función para pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFavoriteCoins(currency);
  }, [currency, fetchFavoriteCoins]);

  // Navegar a detalles
  const handleCoinPress = (coin: CryptoCoin) => {
    router.push({
      pathname: '/crypto-detail' as any,
      params: {
        coinId: coin.id,
        coinName: coin.name,
        coinSymbol: coin.symbol,
        currency: currency,
      },
    });
  };

  // Renderizar tarjeta de criptomoneda
  const renderCoinItem = ({ item }: { item: CryptoCoin }) => {
    const priceChange = item.price_change_percentage_24h || 0;
    const isPositive = priceChange >= 0;
    const favorite = isFavorite(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleCoinPress(item)}
        style={[
          styles.coinCard,
          {
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            borderColor: isDark ? '#333' : '#E0E0E0',
          },
        ]}>
        <View style={styles.coinHeader}>
          <View style={styles.coinInfo}>
            <Text style={[styles.coinRank, { color: colors.icon }]}>
              #{item.market_cap_rank}
            </Text>
            <View style={styles.coinNameContainer}>
              <Text
                style={[styles.coinName, { color: colors.text }]}
                numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.coinSymbol, { color: colors.icon }]}>
                {item.symbol.toUpperCase()}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            style={styles.favoriteButton}>
            <Ionicons
              name={favorite ? 'star' : 'star-outline'}
              size={24}
              color={favorite ? '#FFD700' : colors.icon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.coinPriceContainer}>
          <Text style={[styles.coinPrice, { color: colors.text }]}>
            {formatPrice(item.current_price, currency)}
          </Text>
          <View
            style={[
              styles.priceChangeContainer,
              {
                backgroundColor: isPositive
                  ? 'rgba(76, 175, 80, 0.15)'
                  : 'rgba(244, 67, 54, 0.15)',
              },
            ]}>
            <Ionicons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={14}
              color={isPositive ? '#4CAF50' : '#F44336'}
            />
            <Text
              style={[
                styles.priceChange,
                { color: isPositive ? '#4CAF50' : '#F44336' },
              ]}>
              {formatPercentage(priceChange)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Renderizar header
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={[styles.title, { color: colors.text }]}>
        Mis Favoritos
      </Text>
      <Text style={[styles.subtitle, { color: colors.icon }]}>
        {favoriteCoins.length} {favoriteCoins.length === 1 ? 'criptomoneda' : 'criptomonedas'}
      </Text>

      {/* Selector de Moneda */}
      <View style={styles.currencySelector}>
        <TouchableOpacity
          style={[
            styles.currencyButton,
            {
              backgroundColor:
                currency === 'usd'
                  ? colors.tint
                  : isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
              borderWidth: currency === 'usd' ? 2 : 1,
              borderColor:
                currency === 'usd'
                  ? colors.tint
                  : isDark
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
          onPress={() => {
            setCurrency('usd');
            setLoading(true);
          }}>
          <Text
            style={[
              styles.currencyButtonText,
              {
                color:
                  currency === 'usd'
                    ? '#FFFFFF'
                    : isDark
                      ? '#FFFFFF'
                      : colors.text,
                fontWeight: currency === 'usd' ? '700' : '500',
              },
            ]}>
            USD
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.currencyButton,
            {
              backgroundColor:
                currency === 'mxn'
                  ? colors.tint
                  : isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
              borderWidth: currency === 'mxn' ? 2 : 1,
              borderColor:
                currency === 'mxn'
                  ? colors.tint
                  : isDark
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
          onPress={() => {
            setCurrency('mxn');
            setLoading(true);
          }}>
          <Text
            style={[
              styles.currencyButtonText,
              {
                color:
                  currency === 'mxn'
                    ? '#FFFFFF'
                    : isDark
                      ? '#FFFFFF'
                      : colors.text,
                fontWeight: currency === 'mxn' ? '700' : '500',
              },
            ]}>
            MXN
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.currencyButton,
            {
              backgroundColor:
                currency === 'eur'
                  ? colors.tint
                  : isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
              borderWidth: currency === 'eur' ? 2 : 1,
              borderColor:
                currency === 'eur'
                  ? colors.tint
                  : isDark
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
          onPress={() => {
            setCurrency('eur');
            setLoading(true);
          }}>
          <Text
            style={[
              styles.currencyButtonText,
              {
                color:
                  currency === 'eur'
                    ? '#FFFFFF'
                    : isDark
                      ? '#FFFFFF'
                      : colors.text,
                fontWeight: currency === 'eur' ? '700' : '500',
              },
            ]}>
            EUR
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Renderizar estado de carga
  if ((loading || favoritesLoading) && favoriteCoins.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background },
        ]}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Cargando favoritos...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Renderizar estado vacío
  if (favorites.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background },
        ]}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <Ionicons name="star-outline" size={64} color={colors.icon} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No tienes favoritos
          </Text>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            Agrega criptomonedas a tus favoritos desde la pestaña principal
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Renderizar estado de error
  if (error && favoriteCoins.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background },
        ]}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={() => {
              setLoading(true);
              fetchFavoriteCoins(currency);
            }}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Renderizar lista principal
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={favoriteCoins}
        renderItem={renderCoinItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Ionicons name="star-outline" size={48} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No se encontraron resultados
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
            colors={[colors.tint]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      {loading && favoriteCoins.length > 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.tint} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  currencySelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  currencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 16,
  },
  coinCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  coinHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  coinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  coinRank: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
    minWidth: 40,
  },
  coinNameContainer: {
    flex: 1,
  },
  coinName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  coinSymbol: {
    fontSize: 12,
    fontWeight: '500',
  },
  favoriteButton: {
    padding: 4,
  },
  coinPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coinPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  priceChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});
