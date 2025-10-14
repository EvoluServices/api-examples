// pages/api/session/destroy.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { parse, serialize } from 'cookie';
import {
    DynamoDBClient,
    DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';

const TABLE = process.env.SESSIONS_TABLE_NAME || 'api-examples-sessions';
const REGION = process.env.AWS_REGION || 'us-east-2';

const ddb = new DynamoDBClient({ region: REGION });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        // 1) Ler a sessionId do cookie HttpOnly
        const cookies = parse(req.headers.cookie || '');
        const sessionId = cookies['app-session'];

        // 2) Apagar no Dynamo (se existir)
        if (sessionId) {
            await ddb.send(
                new DeleteItemCommand({
                    TableName: TABLE,
                    Key: { sessionId: { S: sessionId } },
                })
            );
        }

        // 3) Zerar o cookie com os MESMOS atributos usados no set
        res.setHeader(
            'Set-Cookie',
            serialize('app-session', '', {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 0,
                expires: new Date(0),
            })
        );

        return res.status(200).json({ ok: true });
    } catch (e: any) {
        console.error('[session/destroy] error', e?.message);
        return res.status(200).json({ ok: true }); // logout idempotente
    }
}