// pages/api/session/issue.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { jwtDecode } from 'jwt-decode';
import { EncryptJWT } from 'jose';
import { serialize } from 'cookie';

type IdTokenPayload = Record<string, any>;

// --- Helpers de log seguro ---
function mask(s: string, show = 3) {
  if (!s) return '(empty)';
  if (s.length <= show + 2) return `${s[0]}***${s.slice(-1)}`;
  return `${s.slice(0, show)}***${s.slice(-2)}`;
}
function log(...args: any[]) {
  // padroniza prefixo
  // eslint-disable-next-line no-console
  console.log('[session/issue]', ...args);
}
function logErr(...args: any[]) {
  // eslint-disable-next-line no-console
  console.error('[session/issue]', ...args);
}

// --- Secret do JWE ---
const rawSecret = process.env.APP_SESSION_SECRET;
const secret = rawSecret ? new TextEncoder().encode(rawSecret) : undefined;

if (!rawSecret) {
  logErr('APP_SESSION_SECRET is not set (undefined)');
} else {
  log('APP_SESSION_SECRET length(bytes)=', secret?.byteLength, 'NODE_ENV=', process.env.NODE_ENV);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  log('method=', req.method, 'url=', req.url, 'origin=', req.headers.origin, 'referer=', req.headers.referer);

  if (req.method !== 'POST') {
    logErr('invalid_method');
    return res.status(405).end();
  }

  if (!rawSecret || !secret || secret.byteLength !== 32) {
    logErr('invalid_server_secret', {
      hasRaw: !!rawSecret,
      byteLen: secret?.byteLength ?? 0,
      note: 'Must be EXACTLY 32 bytes for A256GCM',
    });
    return res.status(500).json({
      ok: false,
      error: 'invalid_server_secret',
      message: 'APP_SESSION_SECRET must be exactly 32 bytes.',
      len: secret?.byteLength ?? 0,
    });
  }

  const { idToken } = (req.body || {}) as { idToken?: string };
  if (!idToken) {
    logErr('missing_id_token');
    return res.status(400).json({ ok: false, error: 'missing_id_token' });
  }

  try {
    const payload = jwtDecode<IdTokenPayload>(idToken);

    // Descobre ambiente + credenciais
    const env: 'dev' | 'prod' = payload['custom:selected-env'] === 'prod' ? 'prod' : 'dev';
    const apiKey = payload[`custom:${env}-username`] ?? '';
    const apiSecret = payload[`custom:${env}-password`] ?? '';
    const merchantKey = payload[`custom:${env}-keyId`] ?? '';
    const merchantName = payload[`custom:${env}-merchantName`] ?? '';

    // Logs seguros
    log('decoded_token', {
      env,
      apiKey: mask(apiKey),
      apiSecretLen: apiSecret ? apiSecret.length : 0,
      merchantKey: mask(merchantKey),
      merchantName: merchantName || '(empty)',
    });

    if (!apiKey || !apiSecret) {
      logErr('missing_creds_in_token');
      return res.status(400).json({
        ok: false,
        error: 'missing_creds',
        message: 'Custom claims username/password absent.',
      });
    }

    // Monta JWE
    const payloadToEncrypt = { env, apiKey, apiSecret, merchantKey, merchantName };
    const jwe = await new EncryptJWT(payloadToEncrypt)
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .setIssuedAt()
        .setExpirationTime('8h')
        .encrypt(secret);

    // Opções do cookie (log sem conteúdo)
    const cookieOpts = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8, // 8h
    };
    log('set_cookie', { name: 'app-session', ...cookieOpts });

    res.setHeader('Set-Cookie', serialize('app-session', jwe, cookieOpts));

    log('success');
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    logErr('issue_failed', e?.message || e);
    return res.status(400).json({
      ok: false,
      error: 'issue_failed',
      message: e?.message || 'decode_or_encrypt_failed',
    });
  }
}