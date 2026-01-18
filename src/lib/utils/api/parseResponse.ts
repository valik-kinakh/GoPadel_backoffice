/**
 * Custom error type for API responses with additional context
 */
export interface ApiResponseError extends Error {
  status?: number;
  statusText?: string;
  url?: string;
  init?: unknown;
  data?: unknown;
}

/**
 * Parses an API response, handling both JSON and non-JSON responses,
 * and provides detailed error information when the request fails.
 *
 * @example
 * // Normal usage (throws on error)
 * const response = await fetch(requestUrl, init);
 * const { data } = await parseResponse<T>(response, requestUrl, { init });
 *
 * // Safe parsing (returns error object)
 * const { data, error } = await parseResponse<R>(response, requestUrl, { init, safe: true });
 */
export async function parseResponse<R>(
  response: Response,
  url: string | URL,
  options: { init?: RequestInit; safe?: boolean } = {},
): Promise<{
    data: R;
    success: boolean;
    error?: ApiResponseError;
  }> {
  const contentType = response.headers.get('content-type');
  let data: R;

  try {
    if (contentType?.includes('application/json')) {
      data = (await response.json()) as R;
    } else {
      data = (await response.text()) as R;
    }
  } catch (parseError) {
    console.error('Failed to parse response:', {
      url: url.toString(),
      status: response.status,
      contentType,
      error: parseError,
      init: options.init,
    });

    throw new Error(
      `Failed to parse ${contentType ?? 'unknown'} response from ${String(url)}`,
      { cause: parseError },
    );
  }

  if (!response.ok) {
    const error = new Error(
      `Request to ${String(url)} failed with status ${response.status} ${response.statusText}`,
    ) as ApiResponseError;
    error.status = response.status;
    error.statusText = response.statusText;
    error.url = url.toString();
    error.init = options.init;
    error.data = data;

    // If safe is true, we return a gentle response.
    if (options.safe) return { data, success: false, error };

    console.error('Fetch failed:', {
      url: url.toString(),
      status: response.status,
      statusText: response.statusText,
      init: options.init,
      data,
    });

    throw error;
  }

  return { success: true, data };
}
