
import { Colors } from '@/constants/theme';
import { useCoins } from '@/context/CoinContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFavorites } from '@/hooks/use-favorites';
import { formatPercentage, formatPrice } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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
  sparkline_in_7d?: {
    price: number[];
  };
}

type Currency = 'usd' | 'mxn' | 'eur';


// Componente de gráfico simple


interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currency: Currency;
  handleCurrencyChange: (currency: Currency) => void;
  isDark: boolean;
  toggleTheme: () => void;
  colors: any;
}

const Header = ({
  searchQuery,
  setSearchQuery,
  currency,
  handleCurrencyChange,
  isDark,
  toggleTheme,
  colors,
}: HeaderProps) => (
  <View style={styles.headerContainer}>
    <View style={styles.titleRow}>
      <Text style={[styles.title, { color: colors.text }]}>
        CryptoView Mobile
      </Text>
      <View style={styles.headerButtons}>
        <TouchableOpacity
          onPress={toggleTheme}
          style={[
            styles.viewModeButton,
            {
              backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
              borderColor: isDark ? '#444' : '#E0E0E0',
            },
          ]}>
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>
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
        onSubmitEditing={() => Keyboard.dismiss()}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={20} color={colors.icon} />
        </TouchableOpacity>
      )}
    </View>

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
        onPress={() => handleCurrencyChange('usd')}>
        <Text
          style={[
            styles.currencyButtonText,
            {
              color:
                currency === 'usd'
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
        onPress={() => handleCurrencyChange('mxn')}>
        <Text
          style={[
            styles.currencyButtonText,
            {
              color:
                currency === 'mxn'
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
        onPress={() => handleCurrencyChange('eur')}>
        <Text
          style={[
            styles.currencyButtonText,
            {
              color:
                currency === 'eur'
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
export default function HomeScreen() {
  const { colorScheme, toggleTheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { coins, loading, error, currency, setCurrency, refreshCoins } = useCoins();

  // Estados locales solo para UI
  const [filteredCoins, setFilteredCoins] = useState<CryptoCoin[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');


  // Cargar sparkline solo cuando cambia a grid y no tenemos datos de sparkline


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
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCoins();
    setRefreshing(false);
  }, [refreshCoins]);

  // Función para cambiar moneda
  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
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
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.coinHeader}>
          <View style={styles.coinInfo}>
            {item.image && (
              <Image
                source={{ uri: item.image }}
                style={styles.coinImage}
                resizeMode="contain"
              />
            )}
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
                  ? 'rgba(137, 168, 178, 0.15)' // #89A8B2
                  : 'rgba(224, 122, 95, 0.15)', // #E07A5F
              },
            ]}>
            <Ionicons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={14}
              color={isPositive ? colors.chartPositive : colors.chartNegative}
            />
            <Text
              style={[
                styles.priceChange,
                { color: isPositive ? colors.chartPositive : colors.chartNegative },
              ]}>
              {formatPercentage(priceChange)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Renderizar tarjeta de criptomoneda (grid)
  const renderGridItem = ({ item, index }: { item: CryptoCoin; index: number }) => {
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
          <Text style={[styles.gridPriceLabel, { color: colors.text, opacity: 0.6 }]}>Price</Text>
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

  // Renderizar estado de carga
  if (loading && coins.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background },
        ]}>
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currency={currency}
          handleCurrencyChange={handleCurrencyChange}
          isDark={isDark}
          toggleTheme={toggleTheme}
          colors={colors}
        />
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
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currency={currency}
          handleCurrencyChange={handleCurrencyChange}
          isDark={isDark}
          toggleTheme={toggleTheme}
          colors={colors}
        />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={() => {
              refreshCoins();
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
      <FlatList
        key={viewMode} // Forzar re-render al cambiar modo
        data={filteredCoins}
        renderItem={viewMode === 'list' ? renderCoinItem : renderGridItem}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        ListHeaderComponent={
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            currency={currency}
            handleCurrencyChange={handleCurrencyChange}
            isDark={isDark}
            toggleTheme={toggleTheme}
            colors={colors}
          />
        }
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
        columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'space-between', paddingHorizontal: 16 } : undefined}
      />
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
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
  coinImage: {
    width: 32,
    height: 32,
    marginRight: 8,
    borderRadius: 16,
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
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 12,
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
