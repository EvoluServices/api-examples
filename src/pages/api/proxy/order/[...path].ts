// pages/api/proxy/order/[...path].ts
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

        const credentials = Buffer.from(`${config.values.apiKey}:${config.values.apiSecret}`).toString('base64');

        const result = await axios({
            method: req.method,
            url,
            data: req.body,
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/json',
            },
        });

        res.status(result.status).json(result.data);
    } catch (error: any) {
        console.error('Erro no proxy de Order:', error.message);
        const status = error.response?.status || 500;
        const data = error.response?.data || { error: 'Erro ao processar proxy Order.' };
        res.status(status).json(data);
    }
}
