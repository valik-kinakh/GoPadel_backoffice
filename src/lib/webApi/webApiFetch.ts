import { AxiosInput } from '@/lib/utils/types/axiosType';
import { env  } from '@/env';
import { parseResponse } from '@/lib/utils/api/parseResponse';
import {
  clearTokens,
  getAuthHeaders,
} from '@/lib/utils/auth/tokenStorage';
import { buildInit } from '@/lib/utils/api/buildInit';

export async function webApiFetch<T>(
  input: AxiosInput,
  opts: {
    /** Skips authentication headers. Some endpoints, for example Auth, require this. */
    skipAuth?: boolean;
    /** Similar to Zod's `safeParse` option, instead of throwing an error,
     * it will return the response and the parsed payload. */
    safeFetch?: boolean;
  } = {},
): Promise<{
    response: Response;
    payload: T;
    error?: Error;
  }> {
  const {
    url, params, method, data: axiosData, headers: axiosHeaders,
  } = input;
  const { skipAuth, safeFetch } = opts;
  const requestUrl = `${env.NEXT_PUBLIC_API_URL}${url}${
    params
      ? `?${(params instanceof URLSearchParams
        ? params
        : new URLSearchParams(
          Object.entries(params).map(([key, val]) => [key, String(val)]),
        )
      ).toString()}`
      : ''
  }`;

  const authHeaders = skipAuth ? {} : await getAuthHeaders();
  const init = buildInit(method, axiosData, {
    ...axiosHeaders,
    ...authHeaders,
  });

  // Fetch the response
  const response = await fetch(requestUrl, init);

  // If unauthorized and auth was used, try to refresh and retry once
  if (response.status === 401 && !skipAuth) {
    await clearTokens();
  }

  const { data, error } = await parseResponse<T>(response, requestUrl, {
    init,
    safe: safeFetch,
  });

  return { response, payload: data, error };
}
