export type AxiosInput = {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  params?:
  | string
  | string[][]
  | Record<string, string | boolean | number | null | string[]>
  | URLSearchParams
  | undefined;
  data?: unknown;
  headers?: Record<string, string>;
  responseType?: string;
};
