import type { ParsedUrlQueryInput } from "querystring";

type QueryParams = Record<
  string,
  ParsedUrlQueryInput[keyof ParsedUrlQueryInput]
>;

type RouteTypeParamsMap = (
  | { type: "HOME" }
  | { type: 'PLAYERS' }
  | { type: 'USER_ACCESS' }
  | { type: 'STUDIO' }
  | { type: 'APPLICATION_SETTINGS' }
  | { type: 'REPORTS' }
  | { type: 'SETTINGS' }
  | { type: 'ORGANIZATIONS' }
  | { type: 'CLUBS' }
  | { type: 'TOURNAMENTS' }
  | { type: 'MATCHES' }
  ) & {
  query?: QueryParams;
};

export type RouteType = RouteTypeParamsMap["type"];

export type RouteTypeParams<T extends RouteType = RouteType> = Extract<
  RouteTypeParamsMap,
  { type: T }
>;

function simpleUrl(pathname: string, params: RouteTypeParamsMap): string {
  const q = params.query;
  if (!q || Object.keys(q).length === 0) return pathname;

  const parts = Object.entries(q).reduce<string[]>((acc, [key, value]) => {
    if (value == null) return acc;
    const k = encodeURIComponent(key);

    if (Array.isArray(value)) {
      const items = (value as unknown[])
        .filter((v) => v != null)
        .map((v) => `${k}=${encodeURIComponent(String(v))}`);
      if (items.length) acc.push(...items);
    } else {
      acc.push(`${k}=${encodeURIComponent(String(value))}`);
    }
    return acc;
  }, []);

  if (parts.length === 0) return pathname;

  const sep = pathname.includes('?') ? '&' : '?';
  return `${pathname}${sep}${parts.join('&')}`;
}

export function route(params: RouteTypeParamsMap): string {
  if (params.type === 'HOME') return simpleUrl('/', params);
  if (params.type === 'PLAYERS') return simpleUrl('/players', params);
  if (params.type === 'USER_ACCESS') return simpleUrl('/user-access', params);
  if (params.type === 'STUDIO') return simpleUrl('/studio', params);
  if (params.type === 'APPLICATION_SETTINGS') return simpleUrl('/application-settings', params);
  if (params.type === 'REPORTS') return simpleUrl('/reports', params);
  if (params.type === 'SETTINGS') return simpleUrl('/settings', params);
  if (params.type === 'ORGANIZATIONS') return simpleUrl('/organizations', params);
  if (params.type === 'CLUBS') return simpleUrl('/clubs', params);
  if (params.type === 'TOURNAMENTS') return simpleUrl('/tournaments', params);
  if (params.type === 'MATCHES') return simpleUrl('/matches', params);

  // if (params.type === 'USER_BY_ID') return userUrl('/user/[userId]', params);

  // Forces a TypeScript compile error above if a route `type` case is missing.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _exhaustiveCheck: never = params;

  const failedParams = params as RouteTypeParamsMap;
  console.error(
    new Error(
      `Silent Error: Cant generate a route URL: ${JSON.stringify(failedParams)}`,
    ),
  );

  // Send the user to the homepage
  return simpleUrl('/', params);
}
