// pages/api/session/diag.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
    res.status(200).json({
        ok: true,
        region: process.env.AWS_REGION || '(unset)',
        table: 'api-examples-sessions',
        runtime: process.env.AWS_EXECUTION_ENV || '(local)',
    });
}