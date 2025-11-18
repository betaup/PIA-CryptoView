import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFavorites } from '@/hooks/use-favorites';
import { formatPercentage, formatPrice } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface CoinDetail {
  id: string;
  name: string;
  symbol: string;
  image: { large: string };
  market_data: {
    current_price: { [key: string]: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    high_24h: { [key: string]: number };
    low_24h: { [key: string]: number };
    market_cap: { [key: string]: number };
    total_volume: { [key: string]: number };
  };
  description: { en: string };
}

type Currency = 'usd' | 'mxn' | 'eur';

export default function CryptoDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  const { toggleFavorite, isFavorite } = useFavorites();

  const coinId = params.coinId as string;
  const coinName = params.coinName as string;
  const coinSymbol = params.coinSymbol as string;
  const currency = (params.currency as Currency) || 'usd';

  const [coinDetail, setCoinDetail] = useState<CoinDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    fetchCoinDetail();
  }, [coinId]);

  const fetchCoinDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
      );

      if (!response.ok) {
        throw new Error('Error al obtener los datos');
      }

      const data = await response.json();
      setCoinDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching coin detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriceChange = () => {
    if (!coinDetail) return 0;
    switch (selectedPeriod) {
      case '24h':
        return coinDetail.market_data.price_change_percentage_24h;
      case '7d':
        return coinDetail.market_data.price_change_percentage_7d;
      case '30d':
        return coinDetail.market_data.price_change_percentage_30d;
      default:
        return 0;
    }
  };

  const priceChange = getPriceChange();
  const isPositive = priceChange >= 0;
  const favorite = isFavorite(coinId);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {coinName}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Cargando detalles...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !coinDetail) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {coinName}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error || 'No se pudieron cargar los detalles'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={fetchCoinDetail}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentPrice = coinDetail.market_data.current_price[currency] || 0;
  const high24h = coinDetail.market_data.high_24h[currency] || 0;
  const low24h = coinDetail.market_data.low_24h[currency] || 0;
  const marketCap = coinDetail.market_data.market_cap[currency] || 0;
  const volume = coinDetail.market_data.total_volume[currency] || 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          {coinDetail.image?.large && (
            <Image
              source={{ uri: coinDetail.image.large }}
              style={styles.coinIcon}
            />
          )}
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {coinDetail.name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => toggleFavorite(coinId)}
          style={styles.favoriteButton}>
          <Ionicons
            name={favorite ? 'star' : 'star-outline'}
            size={28}
            color={favorite ? '#FFD700' : colors.icon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Precio y Cambio */}
        <View style={styles.priceSection}>
          <Text style={[styles.symbolText, { color: colors.icon }]}>
            {coinDetail.symbol.toUpperCase()} / {currency.toUpperCase()}
          </Text>
          <Text style={[styles.priceText, { color: colors.text }]}>
            {formatPrice(currentPrice, currency)}
          </Text>
          <View style={styles.priceChangeRow}>
            <View
              style={[
                styles.priceChangeBadge,
                {
                  backgroundColor: isPositive
                    ? 'rgba(76, 175, 80, 0.15)'
                    : 'rgba(244, 67, 54, 0.15)',
                },
              ]}>
              <Ionicons
                name={isPositive ? 'trending-up' : 'trending-down'}
                size={18}
                color={isPositive ? '#4CAF50' : '#F44336'}
              />
              <Text
                style={[
                  styles.priceChangeText,
                  { color: isPositive ? '#4CAF50' : '#F44336' },
                ]}>
                {formatPercentage(priceChange)}
              </Text>
            </View>
          </View>
        </View>

        {/* Selector de Período */}
        <View style={styles.periodSelector}>
          {(['24h', '7d', '30d'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                {
                  backgroundColor:
                    selectedPeriod === period
                      ? colors.tint
                      : isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.05)',
                  borderWidth: selectedPeriod === period ? 2 : 1,
                  borderColor:
                    selectedPeriod === period
                      ? colors.tint
                      : isDark
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
              onPress={() => setSelectedPeriod(period)}>
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color:
                      selectedPeriod === period
                        ? '#FFFFFF'
                        : isDark
                          ? '#FFFFFF'
                          : colors.text,
                    fontWeight: selectedPeriod === period ? '700' : '500',
                  },
                ]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Estadísticas */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Estadísticas
          </Text>

          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                },
              ]}>
              <Text style={[styles.statLabel, { color: colors.icon }]}>
                Máximo 24h
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatPrice(high24h, currency)}
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                },
              ]}>
              <Text style={[styles.statLabel, { color: colors.icon }]}>
                Mínimo 24h
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatPrice(low24h, currency)}
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                },
              ]}>
              <Text style={[styles.statLabel, { color: colors.icon }]}>
                Capitalización
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatPrice(marketCap, currency)}
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                },
              ]}>
              <Text style={[styles.statLabel, { color: colors.icon }]}>
                Volumen 24h
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatPrice(volume, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Descripción */}
        {coinDetail.description?.en && (
          <View style={styles.descriptionSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Acerca de {coinDetail.name}
            </Text>
            <Text
              style={[styles.descriptionText, { color: colors.text }]}
              numberOfLines={10}>
              {coinDetail.description.en.replace(/<[^>]*>/g, '')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  coinIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 36,
  },
  favoriteButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  priceSection: {
    padding: 20,
    alignItems: 'center',
  },
  symbolText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  priceChangeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
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
});

