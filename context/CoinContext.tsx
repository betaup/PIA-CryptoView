import { getCachedData, setCachedData } from '@/utils/api-cache';
import { fetchWithBackoff } from '@/utils/api-client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

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

interface CoinContextType {
    coins: CryptoCoin[];
    loading: boolean;
    error: string | null;
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    refreshCoins: () => Promise<void>;
}

const CoinContext = createContext<CoinContextType | undefined>(undefined);

export const CoinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [coins, setCoins] = useState<CryptoCoin[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currency, setCurrency] = useState<Currency>('usd');

    const fetchCoins = useCallback(async (forceRefresh = false) => {
        try {
            setError(null);
            const endpoint = `/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=50&page=1&sparkline=false`;

            if (!forceRefresh) {
                setLoading(true);
                const cached = getCachedData(endpoint);
                if (cached) {
                    setCoins(cached);
                    setLoading(false);
                    return;
                }
            }

            const data = await fetchWithBackoff(endpoint);

            setCachedData(endpoint, data);
            setCoins(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar datos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currency]);

    useEffect(() => {
        fetchCoins();
    }, [fetchCoins]);

    const refreshCoins = async () => {
        await fetchCoins(true);
    };

    return (
        <CoinContext.Provider value={{ coins, loading, error, currency, setCurrency, refreshCoins }}>
            {children}
        </CoinContext.Provider>
    );
};

export const useCoins = () => {
    const context = useContext(CoinContext);
    if (context === undefined) {
        throw new Error('useCoins must be used within a CoinProvider');
    }
    return context;
};
