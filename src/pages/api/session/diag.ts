// pages/api/session/diag.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const allKeys = Object.keys(process.env)
            .filter(k => !k.startsWith('AWS_ACCESS') && !k.includes('SECRET_ACCESS_KEY'));

        const summary = {
            nodeEnv: process.env.NODE_ENV,
            runtime: process.env.AWS_EXECUTION_ENV || '(local)',
            region: process.env.AWS_REGION || '(unset)',
            amplifyAppId: process.env.AMPLIFY_APP_ID || '(unset)',
            branch: process.env.AMPLIFY_BRANCH || '(unset)',
            appSessionSecret: process.env.APP_SESSION_SECRET
                ? `[len=${process.env.APP_SESSION_SECRET.length}]`
                : '(missing)',
            envCount: allKeys.length,
            someVars: allKeys.slice(0, 20),
        };

        console.log('🔍 Amplify runtime environment snapshot:', JSON.stringify(summary, null, 2));

        res.status(200).json({
            ok: true,
            summary,
        });
    } catch (err) {
        console.error('🔥 DIAG ERROR:', err);
        res.status(500).json({
            ok: false,
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : null,
        });
    }
}