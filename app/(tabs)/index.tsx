import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFavorites } from '@/hooks/use-favorites';
import { formatPercentage, formatPrice } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Tipo para los datos de criptomoneda
interface CryptoCoin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
  image: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

type Currency = 'usd' | 'mxn' | 'eur';
type ViewMode = 'list' | 'grid';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 48) / 2; // 16px padding each side + 16px gap

// Componente de gráfico simple
const MiniChart = ({ data, isPositive }: { data: number[]; isPositive: boolean }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.chartPlaceholder}>
        <Ionicons name="trending-up" size={16} color="#999" />
      </View>
    );
  }

  const chartHeight = 40;
  const chartWidth = GRID_ITEM_WIDTH - 32;
  const minPrice = Math.min(...data);
  const maxPrice = Math.max(...data);
  const priceRange = maxPrice - minPrice || 1;

  const points = data.map((price, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const pathData = `M ${points}`;

  return (
    <View style={styles.chartContainer}>
      <Svg width={chartWidth} height={chartHeight} style={styles.chart}>
        <Path
          d={`M ${points}`}
          fill="none"
          stroke={isPositive ? '#4CAF50' : '#F44336'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Estados
  const [coins, setCoins] = useState<CryptoCoin[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<CryptoCoin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>('usd');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Función para obtener datos de la API
  const fetchCoins = useCallback(async (vsCurrency: Currency = 'usd', includeSparkline: boolean = false) => {
    try {
      setError(null);
      const sparklineParam = includeSparkline ? 'true' : 'false';
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vsCurrency}&order=market_cap_desc&per_page=50&page=1&sparkline=${sparklineParam}`
      );

      if (!response.ok) {
        throw new Error('Error al obtener los datos');
      }

      const data = await response.json();
      setCoins(data);
      setFilteredCoins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching coins:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Cargar datos al montar el componente o cambiar vista
  useEffect(() => {
    fetchCoins(currency, viewMode === 'grid');
  }, [currency, viewMode, fetchCoins]);

  // Filtrar monedas según búsqueda
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCoins(coins);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = coins.filter(
        (coin) =>
          coin.name.toLowerCase().includes(query) ||
          coin.symbol.toLowerCase().includes(query)
      );
      setFilteredCoins(filtered);
    }
  }, [searchQuery, coins]);

  // Función para pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCoins(currency, viewMode === 'grid');
  }, [currency, viewMode, fetchCoins]);

  // Función para cambiar moneda
  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    setLoading(true);
  };

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

  // Renderizar tarjeta de criptomoneda (lista)
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

  // Renderizar tarjeta de criptomoneda (grid)
  const renderGridItem = ({ item }: { item: CryptoCoin }) => {
    const priceChange = item.price_change_percentage_24h || 0;
    const isPositive = priceChange >= 0;
    const favorite = isFavorite(item.id);
    const sparklineData = item.sparkline_in_7d?.price || [];

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleCoinPress(item)}
        style={[
          styles.gridCard,
          {
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            borderColor: isDark ? '#333' : '#E0E0E0',
          },
        ]}>
        <View style={styles.gridHeader}>
          <View style={styles.gridCoinInfo}>
            <Text style={[styles.gridCoinName, { color: colors.text }]} numberOfLines={1}>
              {item.symbol.toUpperCase()}
            </Text>
            <Text style={[styles.gridCoinRank, { color: colors.icon }]}>
              #{item.market_cap_rank}
            </Text>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            style={styles.gridFavoriteButton}>
            <Ionicons
              name={favorite ? 'star' : 'star-outline'}
              size={18}
              color={favorite ? '#FFD700' : colors.icon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.gridChartContainer}>
          <MiniChart data={sparklineData} isPositive={isPositive} />
        </View>

        <View style={styles.gridPriceContainer}>
          <Text style={[styles.gridPrice, { color: colors.text }]} numberOfLines={1}>
            {formatPrice(item.current_price, currency)}
          </Text>
          <View
            style={[
              styles.gridPriceChange,
              {
                backgroundColor: isPositive
                  ? 'rgba(76, 175, 80, 0.15)'
                  : 'rgba(244, 67, 54, 0.15)',
              },
            ]}>
            <Text
              style={[
                styles.gridPriceChangeText,
                { color: isPositive ? '#4CAF50' : '#F44336' },
              ]}>
              {formatPercentage(priceChange)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Renderizar header con buscador y selector de moneda
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.text }]}>
          CryptoView Mobile
        </Text>
        <TouchableOpacity
          onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          style={[
            styles.viewModeButton,
            {
              backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
              borderColor: isDark ? '#444' : '#E0E0E0',
            },
          ]}>
          <Ionicons
            name={viewMode === 'list' ? 'grid' : 'list'}
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
            borderColor: isDark ? '#444' : '#E0E0E0',
          },
        ]}>
        <Ionicons
          name="search"
          size={20}
          color={colors.icon}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar criptomoneda..."
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
          blurOnSubmit={false}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Selector de Moneda - Mejorado con mejor opacidad */}
      <View style={styles.currencySelector}>
        <TouchableOpacity
          style={[
            styles.currencyButton,
            {
              backgroundColor:
                currency === 'usd'
                  ? colors.tint
                  : isDark
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(0, 0, 0, 0.08)',
              borderWidth: currency === 'usd' ? 2 : 1,
              borderColor:
                currency === 'usd'
                  ? colors.tint
                  : isDark
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'rgba(0, 0, 0, 0.15)',
              opacity: currency === 'usd' ? 1 : 0.7,
            },
          ]}
          onPress={() => handleCurrencyChange('usd')}>
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
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(0, 0, 0, 0.08)',
              borderWidth: currency === 'mxn' ? 2 : 1,
              borderColor:
                currency === 'mxn'
                  ? colors.tint
                  : isDark
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'rgba(0, 0, 0, 0.15)',
              opacity: currency === 'mxn' ? 1 : 0.7,
            },
          ]}
          onPress={() => handleCurrencyChange('mxn')}>
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
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(0, 0, 0, 0.08)',
              borderWidth: currency === 'eur' ? 2 : 1,
              borderColor:
                currency === 'eur'
                  ? colors.tint
                  : isDark
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'rgba(0, 0, 0, 0.15)',
              opacity: currency === 'eur' ? 1 : 0.7,
            },
          ]}
          onPress={() => handleCurrencyChange('eur')}>
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
  if (loading && coins.length === 0) {
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
            Cargando criptomonedas...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Renderizar estado de error
  if (error && coins.length === 0) {
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
              fetchCoins(currency, viewMode === 'grid');
            }}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Renderizar lista o grid principal
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      {viewMode === 'list' ? (
        <FlatList
          data={filteredCoins}
          renderItem={renderCoinItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="search" size={48} color={colors.icon} />
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
      ) : (
        <FlatList
          data={filteredCoins}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="search" size={48} color={colors.icon} />
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
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      {loading && coins.length > 0 && (
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
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
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
  // Grid styles
  gridContent: {
    padding: 16,
    paddingBottom: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridCard: {
    width: GRID_ITEM_WIDTH,
    padding: 12,
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
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridCoinInfo: {
    flex: 1,
  },
  gridCoinName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  gridCoinRank: {
    fontSize: 10,
    fontWeight: '500',
  },
  gridFavoriteButton: {
    padding: 2,
  },
  gridChartContainer: {
    height: 50,
    marginVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chart: {
    width: '100%',
  },
  chartPlaceholder: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridPriceContainer: {
    marginTop: 4,
  },
  gridPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gridPriceChange: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridPriceChangeText: {
    fontSize: 11,
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
  emptyText: {
    marginTop: 16,
    fontSize: 16,
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
