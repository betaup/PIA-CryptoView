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

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const cache: Map<string, CacheEntry> = new Map();

/**
 * Obtiene datos del caché si están disponibles y no han expirado
 */
export const getCachedData = (key: string): any | null => {
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
export const setCachedData = (key: string, data: any): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    currency: '', // Deprecated but kept for interface compat if needed internally
    includeSparkline: false, // Deprecated
  });
};

/**
 * Limpia el caché
 */
export const clearCache = (): void => {
  cache.clear();
};

