// pages/api/proxy/pos/[...path].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { ApiConfig, COOKIE_CFG_KEY, COOKIE_ENV_KEY } from '../../../../utils/apiConfig';

function getApiConfigFromServerCookies(req: NextApiRequest): ApiConfig {
    const cookieHeader = req.headers.cookie || '';
    const cookies = Object.fromEntries(
        cookieHeader
            .split(';')
            .map((c) => c.trim().split('='))
            .map(([k, ...v]) => [k, decodeURIComponent(v.join('='))])
    );

    const env = cookies[COOKIE_ENV_KEY] as 'dev' | 'prod' | undefined;
    if (env) {
        const raw = cookies[COOKIE_CFG_KEY(env)];
        if (raw) return { ...(JSON.parse(raw)), environment: env };
    }

    throw new Error('Configuração de autenticação não encontrada nos cookies.');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { path = [] } = req.query;

    try {
        const config = getApiConfigFromServerCookies(req);
        const fullPath = Array.isArray(path) ? path.join('/') : path;
        const url = `${config.url}/${fullPath}`;

        const isTokenRequest = fullPath === 'remote/token';
        const bearerToken = req.headers['bearer'];

        console.log('[Proxy POS]');
        console.log('→ URL:', url);
        console.log('→ Método:', req.method);
        console.log('→ Token Bearer:', bearerToken);
        console.log('→ Body:', req.body);

        const headers: any = {
            'Content-Type': 'application/json',
        };

        if (!isTokenRequest) {
            if (!bearerToken) {
                return res.status(401).json({ error: 'Token bearer não fornecido.' });
            }
            headers['bearer'] = String(bearerToken);
        }

        const result = await axios({
            method: req.method,
            url,
            data: req.body,
            headers,
        });

        res.status(result.status).json(result.data);
    } catch (error: any) {
        console.error('Erro no proxy de POS:', error.message);
        const status = error.response?.status || 500;
        const data = error.response?.data || { error: 'Erro ao processar proxy POS.' };
        res.status(status).json(data);
    }
}