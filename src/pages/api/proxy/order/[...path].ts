// pages/api/proxy/order/[...path].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { readSession } from '@/utils/readSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { env, apiKey, apiSecret } = await readSession(req);

    const baseUrl =
      env === 'prod'
        ? 'https://api.evoluservices.com'
        : 'https://sandbox.evoluservices.com';

    const { path = [] } = req.query;
    const fullPath = Array.isArray(path) ? path.join('/') : path;
    const url = `${baseUrl}/${fullPath}`;

    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const result = await axios({
      method: req.method,
      url,
      data: req.body,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    res.status(result.status).json(result.data);
  } catch (error: any) {
    console.error('[order-proxy] error', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    const status = error?.response?.status || 401;
    const data = error?.response?.data || { error: 'Erro ao processar proxy Order.' };
    res.status(status).json(data);
  }
}
