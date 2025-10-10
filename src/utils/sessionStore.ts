import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';

const TABLE = process.env.SESSIONS_TABLE_NAME!;
const TTL_SECS = parseInt(process.env.SESSION_TTL_SECONDS || '28800', 10); // 8h

const client = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-2' })
);

export type StoredSession = {
    sessionId: string;
    env: 'dev' | 'prod';
    apiKey: string;
    apiSecret: string;
    merchantKey?: string;
    merchantName?: string;
    expiresAt: number;
};

export function newSessionId(): string {
    return crypto.randomBytes(32).toString('hex'); // 256 bits
}

export async function putSession(s: Omit<StoredSession, 'expiresAt'>): Promise<void> {
    const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECS;
    await client.send(new PutCommand({
        TableName: TABLE,
        Item: { ...s, expiresAt }
    }));
}

export async function getSession(sessionId: string): Promise<StoredSession | null> {
    const res = await client.send(new GetCommand({
        TableName: TABLE,
        Key: { sessionId }
    }));
    return (res.Item as StoredSession) || null;
}

export async function deleteSession(sessionId: string): Promise<void> {
    await client.send(new DeleteCommand({
        TableName: TABLE,
        Key: { sessionId }
    }));
}