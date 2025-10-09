// src/pages/api/session/diag.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const raw = process.env.APP_SESSION_SECRET;
    const len = raw ? new TextEncoder().encode(raw).byteLength : 0;

    res.status(200).json({
        ok: true,
        nodeEnv: process.env.NODE_ENV,
        hasSecret: !!raw,
        secretByteLen: len, // deve ser 32
        branch: process.env.AMPLIFY_BRANCH || null,
    });
}