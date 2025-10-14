// src/utils/sessionCookie.ts
import type { NextApiRequest } from 'next';
import { serialize } from 'cookie';

export const SESSION_COOKIE = 'app-session';

/**
 * ATENÇÃO: Para evitar mismatch, vamos padronizar SEM definir "domain".
 * Isso cria um cookie host-only — e iremos APAGAR também sem "domain".
 */
function baseCookieOptions() {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: isProd,
        path: '/',
    };
}

export function setSessionCookie(_req: NextApiRequest, value: string, maxAgeSec: number) {
    // _req mantido por compatibilidade se um dia quiser diferenciar por host
    return serialize(SESSION_COOKIE, value, { ...baseCookieOptions(), maxAge: maxAgeSec });
}

export function clearSessionCookie(_req: NextApiRequest) {
    return serialize(SESSION_COOKIE, '', {
        ...baseCookieOptions(),
        maxAge: 0,
        expires: new Date(0),
    });
}