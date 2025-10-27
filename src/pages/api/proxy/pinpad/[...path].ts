// pages/api/proxy/pinpad/[...path].ts
import { readSession } from '@/utils/readSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { path = [] } = req.query;

    try {
        const { env, apiKey, apiSecret, merchantKey } = await readSession(req);

        // Logs seguros (nunca mostra segredo completo)
        console.log('[Proxy PINPAD] env:', env);
        const maskedKey = apiKey ? apiKey.slice(0, 3) + '***' + apiKey.slice(-2) : '(empty)';
        console.log('[Proxy PINPAD] apiKey:', maskedKey, 'apiSecret?', !!apiSecret);

        // Base URL do ambiente
        const baseUrl =
            env === 'prod'
                ? 'https://api.evoluservices.com'
                : 'https://sandbox.evoluservices.com';

        const fullPath = Array.isArray(path) ? path.join('/') : path;
        const url = `${baseUrl}/${fullPath}`;
        const isTokenRequest = fullPath.replace(/^\/+/, '') === 'remote/token'; // tolera barra inicial
        const bearerToken =
            req.headers['authorization']?.toString().replace(/^Bearer\s+/i, '') ||
            req.headers['bearer'];


        console.log('\n[Proxy PINPAD]');
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

            // ✅ Header compatível com EvoluServices
            headers['bearer'] = String(bearerToken);
        }



        // Sempre adiciona Basic Auth (para o backend EvoluServices)
        const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;

        // -----------------------------------------------------------------
        // 🔹 Gerar token remoto com credenciais do usuário logado
        // -----------------------------------------------------------------
        let outBody: any = req.body;
        if (isTokenRequest) {
            const { apiKey: username, apiSecret: password } = await readSession(req);

            if (!username || !password) {
                console.error('[Proxy PINPAD] ❌ Credenciais ausentes na sessão.');
                return res.status(401).json({
                    error: 'Credenciais ausentes para gerar token remoto.',
                });
            }

            // ✅ Formato correto exigido pela EvoluServices
            outBody = {
                auth: {
                    username,
                    apiKey: password,
                },
            };

            console.log('[Proxy PINPAD] 🔑 Normalizando BODY de token:', {
                username: username?.slice(0, 3) + '***',
                apiKey: password ? '***' : '(empty)',
            });
        }

        // Logs de debug final
        console.log('[Proxy PINPAD] isTokenRequest:', isTokenRequest);
        console.log('[Proxy PINPAD] will send BODY:', outBody);

        // -----------------------------------------------------------------
        // 🔹 Requisição à API EvoluServices com método dinâmico
        // -----------------------------------------------------------------
        const result = await axios({
            method: isTokenRequest ? 'POST' : req.method,
            url,
            data: ['POST', 'PUT', 'PATCH'].includes(req.method || '') ? outBody : undefined,
            headers,
        });


        // -----------------------------------------------------------------
        // 🔹 Retorna a resposta da API
        // -----------------------------------------------------------------
        res.status(result.status).json(result.data);
    } catch (error: any) {
        console.error('❌ Erro no proxy de Pinpad:', {
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
        const data =
            error.response?.data || {
                error: 'Erro ao processar proxy Pinpad.',
            };
        res.status(status).json(data);
    }
}
