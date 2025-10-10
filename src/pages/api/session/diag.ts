import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionSecret } from '@/utils/sessionSecret';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const envSecret = process.env.APP_SESSION_SECRET || '';
    const param = process.env.APP_SESSION_PARAM || '(unset)';
    const awsRegion = process.env.AWS_REGION || '(unset)';

    let resolvedLen = 0;
    let resolvedSource: 'env' | 'ssm' | 'none' = 'none';
    let error: string | null = null;

    try {
        const fromEnv = envSecret && envSecret.length >= 32;
        if (fromEnv) {
            resolvedSource = 'env';
            resolvedLen = envSecret.length;
        } else {
            const buf = await getSessionSecret();
            resolvedSource = fromEnv ? 'env' : 'ssm';
            resolvedLen = buf.byteLength;
        }
    } catch (e: any) {
        error = e?.message || String(e);
    }

    res.status(200).json({
        ok: true,
        nodeEnv: process.env.NODE_ENV,
        envSecretLen: envSecret.length,
        param,
        awsRegion,
        resolvedSource,
        resolvedLen,
        error,
    });
}