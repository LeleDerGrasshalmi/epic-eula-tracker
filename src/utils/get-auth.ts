import env from './env.js';

import type { AuthData } from '../types/account-service.js';

let cachedAuth: AuthData | null = null;

export const getAuth = async () => {
  if (cachedAuth && new Date(cachedAuth.expires_at).getTime() - 1000 * 60 > Date.now()) {
    return cachedAuth;
  }

  const res = await fetch(
    'https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.EPIC_CLIENT_ID}:${env.EPIC_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        token_type: 'eg1',
      }),
    },
  );
  const contentType = res.headers.get('content-type');

  if (!res.ok || !contentType?.startsWith('application/json')) {
    console.log(res.status, res.statusText, await res.text());

    throw new Error('Failed to get token');
  }

  const data = <AuthData>(await res.json());

  if (!data?.access_token) {
    console.log(res.status, res.statusText, data);

    throw new Error('Failed to get token from response');
  }

  cachedAuth = data;

  return cachedAuth;
};

export const clearAuth = () => {
  cachedAuth = null;
};
