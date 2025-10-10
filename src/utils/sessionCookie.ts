// src/utils/sessionCookie.ts
import type { NextApiRequest } from 'next';
import { serialize } from 'cookie';

export const SESSION_COOKIE = 'app-session';

function cookieOptions(req: NextApiRequest) {
    const isProd = process.env.NODE_ENV === 'production';
    const host = (req.headers.host || '').split(':')[0];

    // Em dev (localhost) NÃO use domain. Em prod, use seu domínio se não for localhost.
    const domain =
        isProd && host && !/^(localhost|127\.0\.0\.1)$/i.test(host) ? host : undefined;

    return {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: isProd,
        path: '/',
        domain, // undefined em dev => cookie host-only; em prod setamos domínio
    };
}

export function setSessionCookie(req: NextApiRequest, value: string, maxAgeSec: number) {
    return serialize(SESSION_COOKIE, value, { ...cookieOptions(req), maxAge: maxAgeSec });
}

export function clearSessionCookie(req: NextApiRequest) {
    return serialize(SESSION_COOKIE, '', {
        ...cookieOptions(req),
        maxAge: 0,
        expires: new Date(0),
    });
}