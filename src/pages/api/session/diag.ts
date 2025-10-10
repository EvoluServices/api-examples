// src/pages/api/session/diag.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const nodeEnv = process.env.NODE_ENV || '(unset)';
    const awsRegion = process.env.AWS_REGION || '(unset)';
    const appId = process.env.AMPLIFY_APP_ID || '(unset)';
    const branch = process.env.AWS_BRANCH || '(unset)';
    const envSecret = process.env.APP_SESSION_SECRET || '';
    const paramEnv = process.env.APP_SESSION_PARAM;

    let resolvedSource: 'env' | 'param' | 'inferred' | 'none' = 'none';
    let resolvedLen = 0;
    let paramUsed = paramEnv || (appId !== '(unset)' && branch !== '(unset)'
        ? `/amplify/${appId}/${branch}/APP_SESSION_SECRET`
        : undefined);
    let error: string | undefined;

    try {
        if (envSecret && envSecret.length >= 32) {
            resolvedSource = 'env';
            resolvedLen = envSecret.length;
        } else if (paramUsed) {
            const ssm = new SSMClient({ region: awsRegion === '(unset)' ? 'us-east-2' : awsRegion });
            const { Parameter } = await ssm.send(
                new GetParameterCommand({ Name: paramUsed, WithDecryption: true })
            );
            const v = Parameter?.Value || '';
            if (v.length >= 32) {
                resolvedSource = paramEnv ? 'param' : 'inferred';
                resolvedLen = v.length;
            } else {
                error = `SSM value too short (len=${v.length})`;
            }
        } else {
            error = 'Sem APP_SESSION_SECRET, APP_SESSION_PARAM e não foi possível inferir path do SSM.';
        }
    } catch (e: any) {
        error = e?.message || 'read_failed';
    }

    res.status(200).json({
        ok: true,
        nodeEnv,
        awsRegion,
        appId,
        branch,
        envSecretLen: envSecret.length,
        param: paramUsed || '(unset)',
        resolvedSource,
        resolvedLen,
        error
    });
}