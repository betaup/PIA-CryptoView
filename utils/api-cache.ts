/**
 * Sistema de caché simple para las peticiones de la API
 * Evita hacer peticiones repetidas en un corto período de tiempo
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  currency: string;
  includeSparkline: boolean;
}

const CACHE_DURATION = 60000; // 60 segundos
const cache: Map<string, CacheEntry> = new Map();

/**
 * Genera una clave única para el caché basada en los parámetros
 */
const getCacheKey = (currency: string, includeSparkline: boolean): string => {
  return `coins_${currency}_${includeSparkline ? 'sparkline' : 'no-sparkline'}`;
};

/**
 * Obtiene datos del caché si están disponibles y no han expirado
 */
export const getCachedData = (
  currency: string,
  includeSparkline: boolean
): any | null => {
  const key = getCacheKey(currency, includeSparkline);
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  const now = Date.now();
  const age = now - entry.timestamp;

  if (age > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }

  return entry.data;
};

/**
 * Guarda datos en el caché
 */
export const setCachedData = (
  currency: string,
  includeSparkline: boolean,
  data: any
): void => {
  const key = getCacheKey(currency, includeSparkline);
  cache.set(key, {
    data,
    timestamp: Date.now(),
    currency,
    includeSparkline,
  });
};

/**
 * Limpia el caché
 */
export const clearCache = (): void => {
  cache.clear();
};

