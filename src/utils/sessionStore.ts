// src/utils/sessionStore.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';

const DEFAULT_TABLE = 'api-examples-sessions';
const DEFAULT_TTL_SECONDS = 28800;                  // 8h

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-2',
});
const ddb = DynamoDBDocumentClient.from(client);

export function newSessionId() {
    return crypto.randomBytes(16).toString('hex');
}

export type SessionItem = {
    sessionId: string;
    env: 'dev' | 'prod';
    apiKey: string;
    apiSecret: string;
    merchantKey?: string;
    merchantName?: string;
    expiresAt?: number;
};

type PutOpts = {
    tableName?: string;
    ttlSeconds?: number;
};

export async function putSession(item: Omit<SessionItem, 'expiresAt'>, opts: PutOpts = {}) {
    const table = opts.tableName || DEFAULT_TABLE;
    const ttlSeconds = opts.ttlSeconds ?? DEFAULT_TTL_SECONDS;

    const nowSec = Math.floor(Date.now() / 1000);
    const expiresAt = nowSec + ttlSeconds;

    const payload: SessionItem = { ...item, expiresAt };

    console.log('[sessionStore.putSession] table:', table, 'expiresAt:', expiresAt);

    await ddb.send(
        new PutCommand({
            TableName: table,
            Item: payload,
        })
    );
}

export async function getSession(sessionId: string, tableName?: string)
    : Promise<SessionItem | null> {
    const table = tableName || DEFAULT_TABLE;

    const out = await ddb.send(
        new GetCommand({
            TableName: table,
            Key: { sessionId },
            ConsistentRead: true,
        })
    );

    const item = out.Item as SessionItem | undefined;
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Math.floor(Date.now() / 1000)) {
        return null;
    }

    return item;
}

/** Remove a sessão (usado no logout) */
export async function deleteSession(sessionId: string, tableName?: string) {
    const table = tableName || DEFAULT_TABLE;

    await ddb.send(
        new DeleteCommand({
            TableName: table,
            Key: { sessionId },
        })
    );
}