const BASE_URL = 'https://api.coingecko.com/api/v3';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Variable global para rastrear cuándo podemos volver a hacer peticiones
let globalRateLimitReset = 0;

export const fetchWithBackoff = async <T = any>(endpoint: string, options: RequestInit = {}, retries = 4, backoff = 3000): Promise<T> => {
    // Esperar si hay un límite de tasa global activo
    if (Date.now() < globalRateLimitReset) {
        const waitTime = globalRateLimitReset - Date.now() + Math.random() * 500; // Añadir un poco de jitter
        if (waitTime > 0) {
            console.log(`Global rate limit active. Waiting ${Math.round(waitTime)}ms before request to ${endpoint}`);
            await delay(waitTime);
        }
    }

    try {
        const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
        const response = await fetch(url, options);

        if (response.status === 429) {
            // Actualizar el tiempo de reinicio global
            // Si ya hay un reset futuro, lo respetamos, si no, establecemos uno nuevo
            const newResetTime = Date.now() + backoff;
            if (newResetTime > globalRateLimitReset) {
                globalRateLimitReset = newResetTime;
            }

            if (retries > 0) {
                console.warn(`Rate limit hit for ${endpoint}. Retrying in ${backoff}ms...`);
                await delay(backoff);
                return fetchWithBackoff(endpoint, options, retries - 1, backoff * 2);
            } else {
                throw new Error('Demasiadas solicitudes. Por favor espera un momento.');
            }
        }

        if (!response.ok) {
            throw new Error(`Error API: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};
