// pages/api/session/destroy.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import { DynamoDBClient, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { clearSessionCookie, SESSION_COOKIE } from '@/utils/sessionCookie';

const TABLE = process.env.SESSIONS_TABLE_NAME || 'api-examples-sessions';
const REGION = process.env.AWS_REGION || 'us-east-2';
const ddb = new DynamoDBClient({ region: REGION });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const cookies = parse(req.headers.cookie || '');
        const sessionId = cookies[SESSION_COOKIE];

        if (sessionId) {
            await ddb.send(new DeleteItemCommand({
                TableName: TABLE,
                Key: { sessionId: { S: sessionId } },
            }));
        }

        res.setHeader('Set-Cookie', clearSessionCookie(req));
        // Evita cachear a resposta
        res.setHeader('Cache-Control', 'no-store');

        return res.status(200).json({ ok: true });
    } catch (e: any) {
        console.error('[session/destroy] error', e?.message);
        res.setHeader('Set-Cookie', clearSessionCookie(req));
        return res.status(200).json({ ok: true });
    }
}