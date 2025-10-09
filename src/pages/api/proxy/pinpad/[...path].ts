// pages/api/proxy/pinpad/[...path].ts
import { readSession } from '@/utils/readSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { path = [] } = req.query;

    try {
        const { env, apiKey, apiSecret } = await readSession(req);

        // logs seguros
        console.log('[Proxy PINPAD] env:', env);
        const maskedKey = apiKey ? apiKey.slice(0, 3) + '***' + apiKey.slice(-2) : '(empty)';
        console.log('[Proxy PINPAD] apiKey:', maskedKey, 'apiSecret?', !!apiSecret);

        const baseUrl =
            env === 'prod' ? 'https://api.evoluservices.com' : 'https://sandbox.evoluservices.com';

        const fullPath = Array.isArray(path) ? path.join('/') : path;
        const url = `${baseUrl}/${fullPath}`;
        const isTokenRequest = fullPath.replace(/^\/+/, '') === 'remote/token'; // tolera barra inicial
        const bearerToken = req.headers['bearer'];

        console.log('[Proxy PINPAD]');
        console.log('→ URL:', url);
        console.log('→ Método:', req.method);
        console.log('→ Token Bearer (header):', bearerToken);
        console.log('→ Body ORIGINAL:', req.body);

        const headers: any = { 'Content-Type': 'application/json' };

        // Para endpoints que NÃO são o de token, exigimos header 'bearer'
        if (!isTokenRequest) {
            if (!bearerToken) {
                return res.status(401).json({ error: 'Token bearer não fornecido.' });
            }
            headers['bearer'] = String(bearerToken);
        }

        // Sempre adiciona Basic Auth (alguns serviços podem usar também)
        const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;

        // Se for o endpoint de token, garanta body { auth: { username, apiKey } }
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

        // logs finais de debug
        console.log('[Proxy PINPAD] isTokenRequest:', isTokenRequest);
        console.log('[Proxy PINPAD] will send BODY:', outBody);
        if (isTokenRequest && outBody?.auth) {
            const maskedUser = String(outBody.auth.username || '').slice(0, 3) + '***';
            console.log('[Proxy PINPAD] auth.username:', maskedUser);
        }

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
        const data = error.response?.data || { error: 'Erro ao processar proxy Pinpad.' };
        res.status(status).json(data);
    }
}