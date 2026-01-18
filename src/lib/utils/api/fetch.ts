import { getBaseUrl } from '@/lib/utils/api/getBaseUrl';
import { parseResponse } from '@/lib/utils/api/parseResponse';

export async function getFetch<
  A extends (payload: D) => Promise<R>,
  D extends Record<string, string> = Parameters<A>[0],
  R = Awaited<ReturnType<A>>,
>(endpoint: string, payload: D): Promise<R> {
  const url = new URL(endpoint, getBaseUrl());
  url.search = new URLSearchParams(
    Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined),
    ),
  ).toString();
  const response = await fetch(url);
  const { data } = await parseResponse<R>(response, url);
  return data;
}

export async function postFetch<
  A extends (payload: D) => Promise<R>,
  D extends Record<string, unknown> = Parameters<A>[0],
  R = Awaited<ReturnType<A>>,
>(endpoint: string, payload: D): Promise<R> {
  const url = new URL(endpoint, getBaseUrl());
  const init: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  };
  const response = await fetch(url, init);
  const { data } = await parseResponse<R>(response, url, { init });
  return data;
}

export async function putFetch<
  A extends (payload: D) => Promise<R>,
  D extends Record<string, unknown> = Parameters<A>[0],
  R = Awaited<ReturnType<A>>,
>(endpoint: string, payload: D): Promise<R> {
  const url = new URL(endpoint, getBaseUrl());
  const init: RequestInit = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  };
  const response = await fetch(url, init);
  const { data } = await parseResponse<R>(response, url, { init });
  return data;
}

export async function deleteFetch<
  A extends (payload: D) => Promise<R>,
  D extends Record<string, string> = Parameters<A>[0],
  R = Awaited<ReturnType<A>>,
>(endpoint: string, payload: D): Promise<R> {
  const url = new URL(endpoint, getBaseUrl());
  url.search = new URLSearchParams(
    Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined),
    ),
  ).toString();
  const init: RequestInit = {
    method: 'DELETE',
  };
  const response = await fetch(url, init);
  const { data } = await parseResponse<R>(response, url);
  return data;
}
