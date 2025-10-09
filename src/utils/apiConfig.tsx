import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export type Env = 'dev' | 'prod';

export type ApiConfig = {
  url: string;
  values: {
    apiKey: string;
    apiSecret: string;
    merchantName?: string;
    merchantKey?: string;
    callback?: string;
  };
  environment?: Env;
};

/**
 * Lê o token Cognito do cookie "api-examples-token",
 * decodifica e retorna a configuração (url + credenciais) baseada no ambiente.
 */
export function getApiConfigFromToken(): ApiConfig {
  const token = Cookies.get('api-examples-token');
  if (!token) {
    throw new Error('Token Cognito não encontrado (api-examples-token).');
  }

  const payload = jwtDecode<Record<string, any>>(token);
  const env: Env = payload['custom:selected-env'] === 'prod' ? 'prod' : 'dev';

  const apiKey = payload[`custom:${env}-username`] ?? '';
  const apiSecret = payload[`custom:${env}-password`] ?? '';
  const merchantName = payload[`custom:${env}-merchantName`] ?? '';
  const merchantKey = payload[`custom:${env}-keyId`] ?? '';

  if (!apiKey || !apiSecret) {
    throw new Error('Credenciais ausentes no token Cognito.');
  }

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

/** Monta o header Basic Auth a partir do token Cognito decodificado. */
export function buildBasicAuthHeader(): Record<string, string> {
  const cfg = getApiConfigFromToken();
  const { apiKey, apiSecret } = cfg.values;

  const credentials = btoa(`${apiKey}:${apiSecret}`);
  return {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
}
