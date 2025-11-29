/**
 * Sistema para guardar datos temporalmente
 * Evita pedir lo mismo muchas veces seguidas
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
 * Obtiene los datos guardados si aun sirven
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
 * Guarda los datos para usarlos luego
 */
export const setCachedData = (key: string, data: any): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    currency: '', // Ya no se usa pero se mantiene por si acaso
    includeSparkline: false, // Obsoleto
  });
};

/**
 * Borra todo lo guardado
 */
export const clearCache = (): void => {
  cache.clear();
};

