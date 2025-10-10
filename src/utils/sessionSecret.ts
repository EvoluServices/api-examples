// src/utils/getSessionSecret.ts
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

function env(name: string) {
    return process.env[name] ? String(process.env[name]) : undefined;
}

/**
 * Retorna o segredo (32+ chars) como Uint8Array.
 * Ordem:
 * 1) APP_SESSION_SECRET (Segredos do Amplify exposto no runtime SSR)
 * 2) APP_SESSION_PARAM (path explícito do SSM)
 * 3) /amplify/${AMPLIFY_APP_ID}/${AWS_BRANCH}/APP_SESSION_SECRET (inferido)
 */
let cached: Uint8Array | null = null;
export async function getSessionSecret(): Promise<Uint8Array> {
    if (cached) return cached;

    // 1) Segredo direto no runtime (Segredos do Amplify)
    const direct = env('APP_SESSION_SECRET');
    if (direct && direct.length >= 32) {
        cached = new TextEncoder().encode(direct);
        return cached;
    }

    // 2) Path explícito informado
    let paramPath = env('APP_SESSION_PARAM');

    // 3) Path inferido a partir do ambiente do Amplify
    if (!paramPath) {
        const appId = env('AMPLIFY_APP_ID');
        const branch = env('AWS_BRANCH');
        if (!appId || !branch) {
            throw new Error(
                'APP_SESSION_SECRET ausente; APP_SESSION_PARAM não configurado; ' +
                'não foi possível inferir AMPLIFY_APP_ID/AWS_BRANCH.'
            );
        }
        paramPath = `/amplify/${appId}/${branch}/APP_SESSION_SECRET`;
    }

    const region = env('AWS_REGION') || 'us-east-2';
    const ssm = new SSMClient({ region });

    const out = await ssm.send(
        new GetParameterCommand({ Name: paramPath, WithDecryption: true })
    );

    const value = out.Parameter?.Value || '';
    if (!value || value.length < 32) {
        throw new Error(`SSM retornou valor inválido para ${paramPath} (len=${value.length}).`);
    }

    cached = new TextEncoder().encode(value);
    return cached;
}