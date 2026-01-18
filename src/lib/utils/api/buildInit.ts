export function buildInit(
  method: string,
  axiosData?: unknown,
  headers?: HeadersInit,
): RequestInit {
  return {
    method,
    body: axiosData ? JSON.stringify(axiosData) : undefined,
    headers,
  };
}
