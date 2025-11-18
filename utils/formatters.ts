/**
 * Formatea un precio como moneda según la divisa especificada
 * @param price - Precio numérico a formatear
 * @param currency - Código de moneda ('usd', 'mxn', 'eur')
 * @returns String formateado con símbolo de moneda
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
 * Formatea un cambio porcentual con signo y color
 * @param percentage - Cambio porcentual numérico
 * @returns String formateado con signo + o -
 */
export const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
};

