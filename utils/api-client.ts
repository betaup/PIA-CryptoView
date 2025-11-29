const BASE_URL = 'https://api.coingecko.com/api/v3';
const API_KEY = process.env.EXPO_PUBLIC_COINGECKO_API_KEY || '';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Variable para saber cuando podemos volver a pedir datos
let globalRateLimitReset = 0;

export const fetchWithBackoff = async <T = any>(endpoint: string, options: RequestInit = {}, retries = 4, backoff = 3000): Promise<T> => {
    // Espera si hay que detenerse un momento
    if (Date.now() < globalRateLimitReset) {
        const waitTime = globalRateLimitReset - Date.now() + Math.random() * 500; // Agrega un pequeno tiempo extra aleatorio
        if (waitTime > 0) {
            console.log(`Global rate limit active. Waiting ${Math.round(waitTime)}ms before request to ${endpoint}`);
            await delay(waitTime);
        }
    }

    try {
        const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

        // Agrega la clave de API a la peticion
        const headers = {
            ...options.headers,
            'x-cg-demo-api-key': API_KEY,
        };

        const response = await fetch(url, { ...options, headers });

        if (response.status === 429) {
            // Actualiza cuando podemos volver a intentar
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
