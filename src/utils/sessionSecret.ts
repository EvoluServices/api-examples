// src/utils/getSessionSecret.ts
import getConfig from 'next/config';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const SSM_PARAM_NAME = process.env.APP_SESSION_PARAM || ''; // opcional

export async function getSessionSecret(): Promise<string> {
    // 1) Tenta env em runtime
    if (process.env.APP_SESSION_SECRET && process.env.APP_SESSION_SECRET.length >= 32) {
        return process.env.APP_SESSION_SECRET;
    }

    // 2) Tenta serverRuntimeConfig do Next (empacotado no build)
    try {
        const { serverRuntimeConfig } = getConfig() || {};
        const fromConfig = serverRuntimeConfig?.APP_SESSION_SECRET;
        if (fromConfig && typeof fromConfig === 'string' && fromConfig.length >= 32) {
            return fromConfig;
        }
    } catch {
        // getConfig pode não existir em alguns contextos — segue o baile
    }

    // 3) (Opcional) Tenta SSM se você quiser manter como fallback
    if (SSM_PARAM_NAME) {
        try {
            const ssm = new SSMClient({ region: process.env.AWS_REGION || 'us-east-2' });
            const cmd = new GetParameterCommand({ Name: SSM_PARAM_NAME, WithDecryption: true });
            const out = await ssm.send(cmd);
            const v = out.Parameter?.Value || '';
            if (v && v.length >= 32) return v;
        } catch {}
    }

    throw new Error('APP_SESSION_SECRET indisponível no runtime.');
}