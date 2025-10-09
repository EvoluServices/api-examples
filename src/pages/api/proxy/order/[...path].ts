// pages/api/proxy/order/[...path].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

type Env = 'dev' | 'prod';

function getApiConfigFromToken(req: NextApiRequest) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim().split('='))
      .map(([k, ...v]) => [k, decodeURIComponent(v.join('='))])
  );

  const token = cookies['api-examples-token'];
  if (!token) throw new Error('Token Cognito não encontrado.');

  const payload = jwtDecode<Record<string, any>>(token);
  const env: Env = payload['custom:selected-env'] === 'prod' ? 'prod' : 'dev';

  const apiKey = payload[`custom:${env}-username`] ?? '';
  const apiSecret = payload[`custom:${env}-password`] ?? '';
  const merchantName = payload[`custom:${env}-merchantName`] ?? '';
  const merchantKey = payload[`custom:${env}-keyId`] ?? '';

  if (!apiKey || !apiSecret) throw new Error('Credenciais ausentes no token Cognito.');

  const url =
    env === 'prod'
      ? 'https://api.evoluservices.com'
      : 'https://sandbox.evoluservices.com';

  return {
    url,
    values: {
      apiKey,
      apiSecret,
      merchantName,
      merchantKey,
    },
    environment: env,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path = [] } = req.query;

  try {
    const config = getApiConfigFromToken(req);
    const fullPath = Array.isArray(path) ? path.join('/') : path;
    const url = `${config.url}/${fullPath}`;

    const credentials = Buffer.from(`${config.values.apiKey}:${config.values.apiSecret}`)
        .toString('base64');

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
    console.error('Erro no proxy de Order:', error.message);
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: 'Erro ao processar proxy Order.' };
    res.status(status).json(data);
  }
}
