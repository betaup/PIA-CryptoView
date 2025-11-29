/**
 * Convierte un numero a formato de dinero
 * @param price - El precio en numeros
 * @param currency - El tipo de moneda ('usd', 'mxn', 'eur')
 * @returns El precio escrito como dinero
 */
export const formatPrice = (price: number, currency: string): string => {
  const currencyMap: { [key: string]: string } = {
    usd: 'USD',
    mxn: 'MXN',
    eur: 'EUR',
  };

  const currencyCode = currencyMap[currency.toLowerCase()] || 'USD';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

/**
 * Escribe el porcentaje con signo mas o menos
 * @param percentage - El numero del porcentaje
 * @returns El porcentaje escrito con signo
 */
export const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
};

