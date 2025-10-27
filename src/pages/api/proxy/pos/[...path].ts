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
        const isTokenRequest = fullPath.replace(/^\/+/, '') === 'remote/token';
        const bearerToken = req.headers['bearer'];

        console.log('\n[Proxy POS]');
        console.log('→ URL:', url);
        console.log('→ Método:', req.method);
        console.log('→ Token Bearer (header):', bearerToken);
        console.log('→ Body ORIGINAL:', req.body);

        const headers: any = { 'Content-Type': 'application/json' };

        // Exige token para endpoints que não são o de autenticação
        if (!isTokenRequest) {
            if (!bearerToken) {
                return res.status(401).json({ error: 'Token bearer não fornecido.' });
            }
            headers['bearer'] = String(bearerToken);
        }

        // Basic Auth
        const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;

        // Corpo a ser enviado
        let outBody: any = req.body;

        // 🔹 Monta o body da requisição de token se não vier pronto
        if (isTokenRequest) {
            const { apiKey: username, apiSecret: password } = await readSession(req);
            if (!username || !password) {
                console.error('[Proxy POS] ❌ Credenciais ausentes na sessão.');
                return res.status(401).json({ error: 'Credenciais ausentes para gerar token remoto.' });
            }

            outBody = { auth: { username, apiKey: password } };

            console.log('[Proxy POS] 🔑 Gerando token remoto com credenciais mascaradas:', {
                username: username?.slice(0, 3) + '***',
            });
        }

        console.log('[Proxy POS] isTokenRequest:', isTokenRequest);
        console.log('[Proxy POS] will send BODY:', outBody);

        const result = await axios({
            method: isTokenRequest ? 'POST' : req.method,
            url,
            data: ['POST', 'PUT', 'PATCH'].includes(req.method || '') ? outBody : undefined,
            headers,
        });

        res.status(result.status).json(result.data);
    } catch (error: any) {
        console.error('❌ Erro no proxy POS:', {
            message: error?.message,
            status: error?.response?.status,
            data: error?.response?.data,
            url: (error?.config && error?.config?.url) || undefined,
            isTokenRequest:
                (Array.isArray((req as any).query?.path)
                        ? (req as any).query.path.join('/')
                        : (req as any).query?.path || ''
                ).replace(/^\/+/, '') === 'remote/token',
        });

        const status = error.response?.status || 500;
        const data = error.response?.data || { error: 'Erro ao processar proxy POS.' };
        res.status(status).json(data);
    }
}
