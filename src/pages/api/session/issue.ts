import type { NextApiRequest, NextApiResponse } from 'next';
import { jwtDecode } from 'jwt-decode';
import { serialize } from 'cookie';
import { newSessionId, putSession } from '@/utils/sessionStore';

type IdTokenPayload = Record<string, any>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { idToken } = (req.body || {}) as { idToken?: string };
  if (!idToken) return res.status(400).json({ ok: false, error: 'missing_id_token' });

  const TABLE =
      process.env.SESSIONS_TABLE_NAME ??
      process.env.NEXT_PUBLIC_SESSIONS_TABLE_NAME ??
      'api-examples-sessions';

  const TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS || 28800);

  console.log('[session/issue] runtime', {
    nodeEnv: process.env.NODE_ENV,
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
    table: TABLE,
    ttl: TTL_SECONDS,
  });

  if (!TABLE) {
    return res.status(500).json({
      ok: false,
      error: 'config_error',
      message: 'SESSIONS_TABLE_NAME ausente no runtime.',
    });
  }

  try {
    const payload = jwtDecode<IdTokenPayload>(idToken);

    const env: 'dev' | 'prod' = payload['custom:selected-env'] === 'prod' ? 'prod' : 'dev';
    const apiKey = payload[`custom:${env}-username`] ?? '';
    const apiSecret = payload[`custom:${env}-password`] ?? '';
    const merchantKey = payload[`custom:${env}-keyId`] ?? '';
    const merchantName = payload[`custom:${env}-merchantName`] ?? '';

    if (!apiKey || !apiSecret) {
      return res.status(400).json({ ok: false, error: 'missing_creds' });
    }

    const sessionId = newSessionId();

    await putSession(
        {
          sessionId,
          env,
          apiKey,
          apiSecret,
          merchantKey,
          merchantName,
        },
        {
          tableName: TABLE,
          ttlSeconds: TTL_SECONDS,
        }
    );

    res.setHeader(
        'Set-Cookie',
        serialize('app-session', sessionId, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: TTL_SECONDS,
        })
    );

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('[session/issue] error', e?.message || e);
    return res
        .status(400)
        .json({ ok: false, error: 'issue_failed', message: e?.message || 'decode_failed' });
  }
}