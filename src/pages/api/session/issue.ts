import type { NextApiRequest, NextApiResponse } from 'next';
import { jwtDecode } from 'jwt-decode';
import { EncryptJWT } from 'jose';
import { serialize } from 'cookie';
import { getSessionSecret } from '@/utils/sessionSecret';

type IdTokenPayload = Record<string, any>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { idToken } = (req.body || {}) as { idToken?: string };
  if (!idToken) return res.status(400).json({ ok: false, error: 'missing_id_token' });

  try {

    const secret = await getSessionSecret();
    if (!secret || secret.byteLength < 32) {
      return res.status(500).json({ ok: false, error: 'invalid_server_secret', message: 'Secret inválido' });
    }

    const payload = jwtDecode<IdTokenPayload>(idToken);

    const env: 'dev' | 'prod' = payload['custom:selected-env'] === 'prod' ? 'prod' : 'dev';
    const apiKey = payload[`custom:${env}-username`] ?? '';
    const apiSecret = payload[`custom:${env}-password`] ?? '';
    const merchantKey = payload[`custom:${env}-keyId`] ?? '';
    const merchantName = payload[`custom:${env}-merchantName`] ?? '';

    if (!apiKey || !apiSecret) {
      return res.status(400).json({ ok: false, error: 'missing_creds', message: 'Custom claims username/password ausentes.' });
    }

    const jwe = await new EncryptJWT({ env, apiKey, apiSecret, merchantKey, merchantName })
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .setIssuedAt()
        .setExpirationTime('8h')
        .encrypt(secret);

    res.setHeader(
        'Set-Cookie',
        serialize('app-session', jwe, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 8,
        })
    );

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('[session/issue] error', e?.message);
    return res.status(500).json({ ok: false, error: 'issue_failed', message: e?.message || 'decode_or_encrypt_failed' });
  }
}