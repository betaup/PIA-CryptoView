import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFavorites } from '@/hooks/use-favorites';
import { getCachedData, setCachedData } from '@/utils/api-cache';
import { fetchWithBackoff } from '@/utils/api-client';
import { formatPercentage, formatPrice } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const { colorScheme } = useColorScheme();
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
  const fetchFavoriteCoins = useCallback(async (vsCurrency: Currency = 'usd', forceRefresh: boolean = false) => {
    if (favorites.length === 0) {
      setFavoriteCoins([]);
      setLoading(false);
      setRefreshing(false);
      setError(null);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Validar que hay favoritos válidos
      const validFavorites = favorites.filter(id => id && id.trim() !== '');
      if (validFavorites.length === 0) {
        setFavoriteCoins([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Crear clave de caché única para favoritos
      // Crear endpoint único para favoritos
      const ids = validFavorites.join(',');
      const endpoint = `/coins/markets?vs_currency=${vsCurrency}&ids=${ids}&order=market_cap_desc&sparkline=false`;

      // Verificar caché primero (solo si no es un refresh forzado)
      if (!forceRefresh) {
        const cachedData = getCachedData(endpoint);
        if (cachedData) {
          setFavoriteCoins(cachedData);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      const data = await fetchWithBackoff(endpoint);

      // Validar que la respuesta es un array
      if (!Array.isArray(data)) {
        console.warn('API returned non-array data:', data);
        setFavoriteCoins([]);
        return;
      }

      // Mantener el orden de favoritos y filtrar solo los que existen
      const orderedData = validFavorites
        .map((id) => data.find((coin: CryptoCoin) => coin && coin.id === id))
        .filter((coin) => coin !== undefined && coin !== null);

      // Guardar en caché
      setCachedData(endpoint, orderedData);

      setFavoriteCoins(orderedData);
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Error desconocido al cargar favoritos';
      setError(errorMessage);
      console.error('Error fetching favorite coins:', err);
      // No limpiar los favoritos existentes si hay un error de red
      // Solo mostrar el error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [favorites]);

  // Cargar datos cuando cambian los favoritos o la moneda
  useEffect(() => {
    if (!favoritesLoading && favorites.length > 0) {
      // Agregar un delay más largo para evitar rate limiting
      const timer = setTimeout(() => {
        fetchFavoriteCoins(currency);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (favorites.length === 0) {
      setFavoriteCoins([]);
      setLoading(false);
    }
  }, [favorites, currency, favoritesLoading, fetchFavoriteCoins]);

  // Recargar cuando la pantalla se enfoca (con throttling más agresivo)
  useFocusEffect(
    useCallback(() => {
      if (!favoritesLoading && favorites.length > 0) {
        // Solo recargar si han pasado al menos 3 segundos desde la última carga
        const timer = setTimeout(() => {
          fetchFavoriteCoins(currency);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }, [favorites, currency, favoritesLoading, fetchFavoriteCoins])
  );

  // Función para pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFavoriteCoins(currency, true); // forceRefresh = true
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

  // Renderizar tarjeta de criptomoneda (grid)
  const renderGridItem = ({ item }: { item: CryptoCoin }) => {
    const priceChange = item.price_change_percentage_24h || 0;
    const isPositive = priceChange >= 0;
    const favorite = isFavorite(item.id);


    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleCoinPress(item)}
        style={[
          styles.gridCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
          },
        ]}>
        <View style={styles.gridHeader}>
          <View style={styles.gridIconRow}>
            {item.image && (
              <Image
                source={{ uri: item.image }}
                style={styles.gridCoinImage}
                resizeMode="contain"
              />
            )}
            <View style={styles.gridTitleContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.gridCoinSymbol, { color: colors.text }]}>
                  {item.symbol.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 10, color: colors.text, opacity: 0.6, fontWeight: '600' }}>
                  #{item.market_cap_rank}
                </Text>
              </View>
              <Text style={[styles.gridCoinName, { color: colors.text, opacity: 0.7 }]} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            style={styles.gridFavoriteButton}>
            <Ionicons
              name={favorite ? 'star' : 'star-outline'}
              size={20}
              color={favorite ? '#FFD700' : colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.gridPriceSection}>
          <Text style={[styles.gridPriceLabel, { color: colors.text, opacity: 0.6 }]}>Precio</Text>
          <View style={styles.gridPriceRow}>
            <Text style={[styles.gridPrice, { color: colors.text }]}>
              {formatPrice(item.current_price, currency)}
            </Text>
            <Text
              style={[
                styles.gridPriceChange,
                { color: isPositive ? colors.chartPositive : colors.chartNegative },
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

      {/* Selector de Moneda - Mejorado con mejor visibilidad */}
      <View style={styles.currencySelector}>
        <TouchableOpacity
          style={[
            styles.currencyButton,
            {
              backgroundColor:
                currency === 'usd'
                  ? colors.tint
                  : 'transparent',
              borderWidth: 1,
              borderColor:
                currency === 'usd'
                  ? colors.tint
                  : colors.border,
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
                fontWeight: currency === 'usd' ? '700' : '600',
                fontSize: currency === 'usd' ? 15 : 14,
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
                  : 'transparent',
              borderWidth: 1,
              borderColor:
                currency === 'mxn'
                  ? colors.tint
                  : colors.border,
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
                fontWeight: currency === 'mxn' ? '700' : '600',
                fontSize: currency === 'mxn' ? 15 : 14,
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
                  : 'transparent',
              borderWidth: 1,
              borderColor:
                currency === 'eur'
                  ? colors.tint
                  : colors.border,
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
                fontWeight: currency === 'eur' ? '700' : '600',
                fontSize: currency === 'eur' ? 15 : 14,
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

  // Renderizar estado de error (solo si no hay datos y no está cargando)
  if (error && favoriteCoins.length === 0 && !loading && !favoritesLoading) {
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
          <Text style={[styles.errorSubtext, { color: colors.icon }]}>
            Verifica tu conexión a internet e intenta nuevamente
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={() => {
              setError(null);
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
        renderItem={renderGridItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
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
      {error && favoriteCoins.length > 0 && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color="#FFFFFF" />
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity
            onPress={() => {
              setError(null);
              fetchFavoriteCoins(currency);
            }}>
            <Text style={styles.errorBannerRetry}>Reintentar</Text>
          </TouchableOpacity>
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
  // Grid Styles
  gridCard: {
    flex: 1,
    marginBottom: 16,
    padding: 16,
    borderRadius: 24,
    maxWidth: '48%',
    minHeight: 140,
    justifyContent: 'space-between',
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gridIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gridCoinImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  gridTitleContainer: {
    flex: 1,
  },
  gridCoinSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  gridCoinName: {
    fontSize: 12,
    marginTop: 2,
  },
  gridFavoriteButton: {
    padding: 4,
  },
  gridPriceSection: {
    marginTop: 8,
  },
  gridPriceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  gridPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  gridPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  gridPriceChange: {
    fontSize: 12,
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
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
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
  errorBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  errorBannerText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 8,
  },
  errorBannerRetry: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
