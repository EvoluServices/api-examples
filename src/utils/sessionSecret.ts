// src/utils/sessionSecret.ts
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

let cached: Uint8Array | null = null;

export async function getSessionSecret(): Promise<Uint8Array> {
    if (cached) return cached;

    const raw = process.env.APP_SESSION_SECRET;
    if (raw && raw.length >= 32) {
        cached = new TextEncoder().encode(raw);
        return cached;
    }

    const paramPath = process.env.APP_SESSION_PARAM;
    if (!paramPath) {
        throw new Error("APP_SESSION_SECRET ausente e APP_SESSION_PARAM não configurado.");
    }

    const region = process.env.AWS_REGION || "us-east-2";
    const ssm = new SSMClient({ region });

    const out = await ssm.send(
        new GetParameterCommand({
            Name: paramPath,
            WithDecryption: true,
        })
    );

    const value = out.Parameter?.Value;
    if (!value || value.length < 32) {
        throw new Error("Falha ao ler segredo no SSM (vazio ou < 32 chars).");
    }

    cached = new TextEncoder().encode(value);
    return cached;
}