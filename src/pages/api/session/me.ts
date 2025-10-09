import type { NextApiRequest, NextApiResponse } from 'next';
import { readSession } from '@/utils/readSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { env, merchantKey, merchantName,apiKey, apiSecret
    } = await readSession(req);

    res.status(200).json({
      ok: true,
      env,
      merchantKey: merchantKey ?? null,
      merchantName: merchantName ?? null,
      apiKey: apiKey ?? null,
      apiSecret: apiSecret ?? null,

    });
  } catch (e: any) {
    res.status(401).json({ ok: false, error: e?.message || 'unauthorized' });
  }
}