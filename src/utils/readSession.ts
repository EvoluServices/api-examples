import type { NextApiRequest } from 'next';
import { getSession } from '@/utils/sessionStore';

export async function readSession(req: NextApiRequest) {
    const cookieHeader = req.headers.cookie || '';
    const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => c.trim().split('=')).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))])
    );
    const sessionId = cookies['app-session'];
    if (!sessionId) throw new Error('no_session_cookie');

    const s = await getSession(sessionId);
    if (!s) throw new Error('session_not_found');

    const { env, apiKey, apiSecret, merchantKey, merchantName } = s;
    return { env, apiKey, apiSecret, merchantKey, merchantName } as {
        env: 'dev' | 'prod';
        apiKey: string;
        apiSecret: string;
        merchantKey?: string;
        merchantName?: string;
    };
}