import type { AuthData } from '../types/account-service.js';
import { Eula } from '../types/eulatracking-service.js';

export default async (auth: AuthData, eulaKey: string, locale: string) => {
  const res = await fetch(
    `https://eulatracking-public-service-prod.ol.epicgames.com/eulatracking/api/shared/agreements/${eulaKey}?locale=${locale}`,
    {
      headers: {
        Authorization: `${auth.token_type} ${auth.access_token}`,
      },
    },
  );

  const contentType = res.headers.get('content-type');

  if (!res.ok || !contentType?.startsWith('application/json')) {
    console.log(`failed fetching eula '${eulaKey}'`, res.status, res.statusText, await res.text());

    return {
      success: false as const,
    };
  }

  return {
    success: true as const,
    data: <Eula>(await res.json()),
  };
};
