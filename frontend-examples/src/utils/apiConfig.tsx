import Cookies from 'js-cookie';

type Env = 'dev' | 'prod';

export const COOKIE_ENV_KEY = 'api-examples-selected-env'; // 'dev' | 'prod'
export const COOKIE_CFG_KEY = (env: Env) => `api-examples-config-${env}`;
export const COOKIE_LEGACY  = 'api-examples-config';

export type ApiConfig = {
    url: string;
    values: {
        apiKey: string;
        apiSecret: string;
        merchantName?: string;
        merchantKey?: string;
        callback?: string;
    };
    environment?: Env;
};

/** Lê config dos cookies (novo formato, com fallback para o antigo). */
export function getApiConfigFromCookies(): ApiConfig {
    const selected = Cookies.get(COOKIE_ENV_KEY) as Env | undefined;

    if (selected) {
        const raw = Cookies.get(COOKIE_CFG_KEY(selected));
        if (raw) {
            const cfg = JSON.parse(raw) as ApiConfig;
            return { ...cfg, environment: selected };
        }
    }

    const legacyRaw = Cookies.get(COOKIE_LEGACY);
    if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw) as ApiConfig;
        const env = (legacy as any).environment as Env | undefined;
        return { ...legacy, environment: env };
    }

    throw new Error('Configuração de autenticação não encontrada nos cookies.');
}

/** Monta o header Basic Auth a partir do config. */
export function buildBasicAuthHeader(cfg: ApiConfig) {
    const { apiKey, apiSecret } = cfg.values || ({} as any);
    if (!apiKey || !apiSecret) {
        throw new Error('API Key/Secret ausentes na configuração.');
    }
    const credentials = btoa(`${apiKey}:${apiSecret}`);
    return {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
    };
}
