import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFavorites } from '@/hooks/use-favorites';
import { getCachedData, setCachedData } from '@/utils/api-cache';
import { fetchWithBackoff } from '@/utils/api-client';
import { formatPercentage, formatPrice } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function StatsScreen() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { toggleFavorite, isFavorite } = useFavorites();

    // Estados
    const [coins, setCoins] = useState<CryptoCoin[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currency, setCurrency] = useState<Currency>('usd');
    const [refreshing, setRefreshing] = useState<boolean>(false);

    // Función para obtener datos de la API
    const fetchCoins = useCallback(async (vsCurrency: Currency = 'usd', forceRefresh: boolean = false) => {
        try {
            setError(null);

            // Verificar caché primero (solo si no es un refresh forzado)
            if (!forceRefresh) {
                const cachedData = getCachedData(vsCurrency, true); // Siempre pedimos sparkline
                if (cachedData) {
                    setCoins(cachedData);
                    setLoading(false);
                    setRefreshing(false);
                    return;
                }
            }

            // Siempre pedimos sparkline en esta vista
            const data = await fetchWithBackoff(
                `/coins/markets?vs_currency=${vsCurrency}&order=market_cap_desc&per_page=30&page=1&sparkline=true`
            );

            // Guardar en caché
            setCachedData(vsCurrency, true, data);

            setCoins(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            console.error('Error fetching coins:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Cargar datos al montar el componente o cambiar moneda
    useEffect(() => {
        fetchCoins(currency);
    }, [currency, fetchCoins]);

    // Función para pull-to-refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchCoins(currency, true); // forceRefresh = true
    }, [currency, fetchCoins]);

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

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
                Estadísticas
            </Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
                Visión general del mercado
            </Text>

            {/* Selector de Moneda */}
            <View style={styles.currencySelector}>
                {(['usd', 'mxn', 'eur'] as Currency[]).map((curr) => (
                    <TouchableOpacity
                        key={curr}
                        style={[
                            styles.currencyButton,
                            {
                                backgroundColor: currency === curr ? colors.tint : 'transparent',
                                borderColor: currency === curr ? colors.tint : colors.icon,
                                borderWidth: 1,
                            },
                        ]}
                        onPress={() => handleCurrencyChange(curr)}>
                        <Text
                            style={[
                                styles.currencyButtonText,
                                {
                                    color: currency === curr ? '#FFFFFF' : colors.text,
                                    fontWeight: currency === curr ? '700' : '500',
                                },
                            ]}>
                            {curr.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={coins}
                renderItem={renderGridItem}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.centerContainer}>
                            <Ionicons name="stats-chart" size={48} color={colors.icon} />
                            <Text style={[styles.emptyText, { color: colors.text }]}>
                                No hay datos disponibles
                            </Text>
                        </View>
                    ) : null
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
            {loading && coins.length === 0 && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.tint} />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 16,
    },
    currencySelector: {
        flexDirection: 'row',
        gap: 8,
    },
    currencyButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    currencyButtonText: {
        fontSize: 12,
    },
    gridContent: {
        padding: 16,
        paddingTop: 0,
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
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    gridHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    gridCoinInfo: {
        flex: 1,
    },
    gridCoinName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    gridCoinRank: {
        fontSize: 12,
    },
    gridFavoriteButton: {
        padding: 4,
    },
    gridChartContainer: {
        height: 40,
        marginVertical: 8,
        justifyContent: 'center',
    },
    chartContainer: {
        height: 40,
        justifyContent: 'center',
    },
    chart: {
        height: 40,
    },
    chartPlaceholder: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 4,
    },
    gridPriceContainer: {
        marginTop: 4,
    },
    gridPrice: {
        fontSize: 16,
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
});


