// utils/readSession.ts
import type { NextApiRequest } from 'next';
import { jwtDecrypt } from 'jose';

const secret = new TextEncoder().encode(process.env.APP_SESSION_SECRET!);

export async function readSession(req: NextApiRequest) {
    const cookieHeader = req.headers.cookie || '';
    const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => c.trim().split('=')).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))])
    );
    const jwe = cookies['app-session'];
    if (!jwe) throw new Error('no_session_cookie');

    const { payload } = await jwtDecrypt(jwe, secret);
    // payload é o mesmo objeto que você encriptou em issue.ts
    return payload as {
        env: 'dev' | 'prod';
        apiKey: string;
        apiSecret: string;
        merchantKey?: string;
        merchantName?: string;
    };
}