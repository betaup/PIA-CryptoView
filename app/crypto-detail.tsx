import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFavorites } from '@/hooks/use-favorites';
import { fetchWithBackoff } from '@/utils/api-client';
import { formatPercentage, formatPrice } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, G, Line, LinearGradient, Path, Stop } from 'react-native-svg';

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
    market_cap_rank: number;
    total_volume: { [key: string]: number };
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
    sparkline_7d?: {
      price: number[];
    };
  };
  description: { en: string };
}

type Currency = 'usd' | 'mxn' | 'eur';
type ChartInterval = '24H' | '7D' | '1M';

const { width } = Dimensions.get('window');

// Componente de gráfico de línea

// Componente de gráfico de línea mejorado
const PriceChart = ({
  data,
  color
}: {
  data: number[];
  color: string;
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  const chartHeight = 220;
  const chartWidth = width - 32;
  const paddingVertical = 20;
  const paddingHorizontal = 0;
  const contentHeight = chartHeight - paddingVertical * 2;

  const minPrice = Math.min(...data);
  const maxPrice = Math.max(...data);
  const priceRange = maxPrice - minPrice || 1;

  // Puntos del gráfico
  const points = data.map((price, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = paddingVertical + contentHeight - ((price - minPrice) / priceRange) * contentHeight;
    return { x, y };
  });

  const pathData = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
  ).join(' ');

  const fillPath = `${pathData} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;

  // Líneas de la cuadrícula (5 líneas horizontales)
  const gridLines = Array.from({ length: 5 }).map((_, i) => {
    const y = paddingVertical + (contentHeight / 4) * i;
    return (
      <Line
        key={i}
        x1="0"
        y1={y}
        x2={chartWidth}
        y2={y}
        stroke="rgba(150, 150, 150, 0.2)"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
    );
  });

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 10, color: '#888' }}>{maxPrice.toLocaleString()}</Text>
      </View>

      <Svg width={chartWidth} height={chartHeight} style={styles.chart}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Cuadrícula */}
        <G>
          {gridLines}
        </G>

        {/* Área sombreada */}
        <Path
          d={fillPath}
          fill="url(#gradient)"
        />

        {/* Línea del gráfico */}
        <Path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -20, paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 10, color: '#888' }}>{minPrice.toLocaleString()}</Text>
      </View>
    </View>
  );
};

export default function CryptoDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
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
  const [selectedInterval, setSelectedInterval] = useState<ChartInterval>('24H');
  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    fetchCoinDetail();
  }, [coinId]);

  useEffect(() => {
    fetchChartData(selectedInterval);
  }, [coinId, selectedInterval, currency]);

  const fetchCoinDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithBackoff(
        `/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`
      );
      setCoinDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching coin detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async (interval: ChartInterval) => {
    try {
      setChartLoading(true);
      let days = '1';
      switch (interval) {
        case '24H':
          days = '1';
          break;
        case '7D':
          days = '7';
          break;
        case '1M':
          days = '30';
          break;
      }

      const data = await fetchWithBackoff(
        `/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`
      );

      let prices = data.prices.map((item: [number, number]) => item[1]);

      setChartData(prices);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      // Fallback to sparkline if available and interval is 7D (closest match to sparkline_7d)
      if (interval === '7D' && coinDetail?.market_data.sparkline_7d?.price) {
        setChartData(coinDetail.market_data.sparkline_7d.price);
      }
    } finally {
      setChartLoading(false);
    }
  };

  const priceChange24h = coinDetail?.market_data.price_change_percentage_24h || 0;
  // Calcular cambio para el intervalo seleccionado si es posible, por ahora usamos 24h para color base
  // pero idealmente calcularíamos el cambio del gráfico.
  const chartIsPositive = chartData.length > 0
    ? chartData[chartData.length - 1] >= chartData[0]
    : priceChange24h >= 0;

  const isPositive = priceChange24h >= 0;
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
  const marketCap = coinDetail.market_data.market_cap[currency] || 0;
  const volume = coinDetail.market_data.total_volume[currency] || 0;
  const marketCapRank = coinDetail.market_data.market_cap_rank || 0;
  const maxSupply = coinDetail.market_data.max_supply || 0;

  const intervals: ChartInterval[] = ['24H', '7D', '1M'];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#333' : 'rgba(0,0,0,0.1)' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {coinDetail.symbol.toUpperCase()}
          </Text>
          <Text style={[styles.headerRank, { color: colors.icon }]}>
            #{marketCapRank}
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
          <Text style={[styles.priceText, { color: colors.text }]}>
            {formatPrice(currentPrice, currency)}
          </Text>
          <View style={styles.priceChangeRow}>
            <Text
              style={[
                styles.priceChangeText,
                { color: isPositive ? colors.chartPositive : colors.chartNegative },
              ]}>
              {formatPercentage(priceChange24h)} (24h)
            </Text>
          </View>
        </View>

        {/* Gráfico */}
        <View style={styles.chartContainer}>
          {chartLoading ? (
            <View style={[styles.chartPlaceholder, { backgroundColor: 'transparent' }]}>
              <ActivityIndicator size="small" color={colors.tint} />
            </View>
          ) : chartData.length > 0 ? (
            <View style={styles.chartWrapper}>
              <PriceChart data={chartData} color={chartIsPositive ? colors.chartPositive : colors.chartNegative} />
            </View>
          ) : (
            <View style={[styles.chartPlaceholder, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}>
              <Ionicons name="bar-chart" size={64} color={colors.icon} />
              <Text style={[styles.chartPlaceholderText, { color: colors.icon }]}>
                Gráfico no disponible
              </Text>
            </View>
          )}

          {/* Controles del Gráfico */}
          <View style={styles.chartControls}>
            {intervals.map((interval) => (
              <TouchableOpacity
                key={interval}
                style={[
                  styles.intervalButton,
                  {
                    backgroundColor: selectedInterval === interval
                      ? (isDark ? 'transparent' : colors.tint)
                      : (isDark ? '#1E1E1E' : '#F0F0F0'),
                    borderColor: selectedInterval === interval && isDark
                      ? colors.tint
                      : 'transparent',
                  },
                ]}
                onPress={() => setSelectedInterval(interval)}>
                <Text
                  style={[
                    styles.intervalText,
                    {
                      color: selectedInterval === interval
                        ? (isDark ? colors.tint : '#FFFFFF')
                        : colors.text,
                      fontWeight: selectedInterval === interval ? '700' : '500',
                    },
                  ]}>
                  {interval}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Estadísticas */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Estadísticas
          </Text>

          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.icon }]}>
              Capitalización de Mercado
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatPrice(marketCap, currency)}
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />

          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.icon }]}>
              Volumen 24h
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatPrice(volume, currency)}
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />

          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.icon }]}>
              Suministro Máximo
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {maxSupply > 0 ? `${(maxSupply / 1_000_000).toFixed(2)}M ${coinDetail.symbol.toUpperCase()}` : 'N/A'}
            </Text>
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
              numberOfLines={15}>
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
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRank: {
    fontSize: 14,
    fontWeight: '500',
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
  priceText: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceChangeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  chartWrapper: {
    marginBottom: 16,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
  },
  chartPlaceholder: {
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  chartControls: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  intervalButton: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  intervalText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statDivider: {
    height: 1,
  },
  descriptionSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
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
