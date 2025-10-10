import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';

const DEFAULT_TABLE = 'api-examples-sessions';              // <- fixo
const DEFAULT_TTL_SECONDS = 28800;

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-2',
});

export function newSessionId() {
    return crypto.randomBytes(16).toString('hex');
}

type SessionItem = {
    sessionId: string;
    env: 'dev' | 'prod';
    apiKey: string;
    apiSecret: string;
    merchantKey?: string;
    merchantName?: string;
};

type PutOpts = {
    tableName?: string;
    ttlSeconds?: number;
};

export async function putSession(item: SessionItem, opts: PutOpts = {}) {
    const table = opts.tableName || DEFAULT_TABLE;                 // <- fallback
    const ttlSeconds = opts.ttlSeconds ?? DEFAULT_TTL_SECONDS;

    const nowSec = Math.floor(Date.now() / 1000);
    const expiresAt = nowSec + ttlSeconds;

    const payload = {
        ...item,
        expiresAt,
    };

    console.log('[sessionStore.putSession] table:', table, 'expiresAt:', expiresAt);

    await client.send(
        new PutCommand({
            TableName: table,                                          // <- nunca nulo
            Item: payload,
        })
    );
}