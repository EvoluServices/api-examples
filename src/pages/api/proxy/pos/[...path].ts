// pages/api/proxy/pos/[...path].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { readSession } from '@/utils/readSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { path = [] } = req.query;

    try {
        const { env, apiKey, apiSecret } = await readSession(req);
        const baseUrl =
            env === 'prod'
                ? 'https://api.evoluservices.com'
                : 'https://sandbox.evoluservices.com';

        const fullPath = Array.isArray(path) ? path.join('/') : path;
        const url = `${baseUrl}/${fullPath}`;

        const isTokenRequest = fullPath.replace(/^\/+/, '') === 'remote/token'; // tolera barra inicial
        const bearerToken = req.headers['bearer'];

        console.log('[Proxy POS]');
        console.log('→ URL:', url);
        console.log('→ Método:', req.method);
        console.log('→ Token Bearer:', bearerToken);
        console.log('→ Body:', req.body);

        // Se for a rota de token, injete body { auth: { username, apiKey } } se faltar
        let outBody: any = req.body;
        if (isTokenRequest) {
          const invalid =
            !outBody ||
            typeof outBody !== 'object' ||
            !outBody.auth ||
            typeof outBody.auth !== 'object' ||
            !outBody.auth.username ||
            !outBody.auth.apiKey;

          if (invalid) {
            outBody = { auth: { username: apiKey, apiKey: apiSecret } };
          }
        }

        console.log('[Proxy POS] isTokenRequest:', isTokenRequest);
        console.log('[Proxy POS] will send BODY:', outBody);
        if (isTokenRequest && outBody?.auth) {
          const maskedUser = String(outBody.auth.username || '').slice(0,3) + '***';
          console.log('[Proxy POS] auth.username:', maskedUser);
        }

        const headers: any = {
            'Content-Type': 'application/json',
        };

        if (!isTokenRequest) {
            if (!bearerToken) {
                return res.status(401).json({ error: 'Token bearer não fornecido.' });
            }
            headers['bearer'] = String(bearerToken);
        }

        const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;

        const result = await axios({
            method: req.method,
            url,
            data: outBody,
            headers,
        });

        res.status(result.status).json(result.data);
    } catch (error: any) {
        console.error('Erro no proxy de Pinpad:', {
            message: error?.message,
            status: error?.response?.status,
            data: error?.response?.data,
            url: (error?.config && error?.config?.url) || undefined,
            isTokenRequest: (Array.isArray((req as any).query?.path) ? (req as any).query.path.join('/') : (req as any).query?.path || '').replace(/^\/+/, '') === 'remote/token',
        });
        const status = error.response?.status || 500;
        const data = error.response?.data || { error: 'Erro ao processar proxy POS.' };
        res.status(status).json(data);
    }
}