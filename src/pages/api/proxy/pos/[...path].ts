// pages/api/proxy/pos/[...path].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

type Env = 'dev' | 'prod';

function getBaseUrlFromToken(req: NextApiRequest) {
    const cookieHeader = req.headers.cookie || '';
    const cookies = Object.fromEntries(
        cookieHeader
            .split(';')
            .map((c) => c.trim().split('='))
            .map(([k, ...v]) => [k, decodeURIComponent(v.join('='))])
    );

    const idToken = cookies['api-examples-token'];
    if (!idToken) {
        throw new Error('Token Cognito não encontrado (api-examples-token).');
    }

    const payload = jwtDecode<Record<string, any>>(idToken);
    const env: Env = payload['custom:selected-env'] === 'prod' ? 'prod' : 'dev';

    const baseUrl =
        env === 'prod'
            ? 'https://api.evoluservices.com'
            : 'https://sandbox.evoluservices.com';

    return { baseUrl, env };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { path = [] } = req.query;

    try {
        const { baseUrl } = getBaseUrlFromToken(req);
        const fullPath = Array.isArray(path) ? path.join('/') : path;
        const url = `${baseUrl}/${fullPath}`;

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