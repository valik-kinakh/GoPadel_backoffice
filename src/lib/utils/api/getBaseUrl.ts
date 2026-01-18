import { env } from '@/env';

export function getBaseUrl() {
  return env.NEXT_PUBLIC_API_URL;
}
