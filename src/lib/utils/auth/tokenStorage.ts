const SESSION_COOKIE_NAME = 'padelnet.session';

type SameSiteOption = 'lax' | 'strict' | 'none';

export type SessionCookieOptions = {
  /** Max age in seconds for the session cookie. */
  maxAgeSeconds?: number;
  /** Explicit expiration date for the cookie. */
  expiresAt?: Date;
  /** Cookie path. Defaults to '/'. */
  path?: string;
  /** SameSite policy. Defaults to 'lax'. */
  sameSite?: SameSiteOption;
  /** Force secure flag. Defaults to true in production. */
  secure?: boolean;
};

const isServer = typeof window === 'undefined';

async function getServerCookieStore() {
  const { cookies } = await import('next/headers');
  return cookies();
}

function getClientCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1] ?? '') : null;
}

function buildClientCookie(
  name: string,
  value: string,
  options: SessionCookieOptions = {},
): string {
  const secure = options.secure ?? process.env.NODE_ENV === 'production';
  const sameSite = options.sameSite ?? 'lax';
  const path = options.path ?? '/';
  const attributes = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
  ];

  if (options.maxAgeSeconds !== undefined) {
    attributes.push(`Max-Age=${options.maxAgeSeconds}`);
  }

  if (options.expiresAt) {
    attributes.push(`Expires=${options.expiresAt.toUTCString()}`);
  }

  if (secure) {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}

export async function setSessionToken(
  token: string,
  options: SessionCookieOptions = {},
): Promise<void> {
  if (!token) return;

  if (isServer) {
    const store = await getServerCookieStore();
    store.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: options.secure ?? process.env.NODE_ENV === 'production',
      sameSite: options.sameSite ?? 'lax',
      path: options.path ?? '/',
      maxAge: options.maxAgeSeconds,
      expires: options.expiresAt,
    });
    return;
  }

  document.cookie = buildClientCookie(SESSION_COOKIE_NAME, token, options);
}

export async function getSessionToken(): Promise<string | null> {
  if (isServer) {
    const store = await getServerCookieStore();
    return store.get(SESSION_COOKIE_NAME)?.value ?? null;
  }

  return getClientCookieValue(SESSION_COOKIE_NAME);
}

export async function clearTokens(): Promise<void> {
  if (isServer) {
    const store = await getServerCookieStore();
    store.delete(SESSION_COOKIE_NAME);
    return;
  }

  document.cookie = buildClientCookie(SESSION_COOKIE_NAME, '', {
    maxAgeSeconds: 0,
  });
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getSessionToken();
  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
  };
}
