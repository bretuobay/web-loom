import type { NavigationLocation } from './types';

export type QueryValues =
  | string
  | number
  | boolean
  | undefined
  | null
  | (string | number | boolean | undefined | null)[];

export type QueryObject = Record<string, QueryValues>;

export function parseQuery(queryString: string): Record<string, string | string[]> {
  const query = queryString.startsWith('?') ? queryString.slice(1) : queryString;
  if (!query) {
    return {};
  }

  const searchParams = new URLSearchParams(query);
  const result: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const current = result[key];
      if (Array.isArray(current)) {
        current.push(value);
      } else {
        result[key] = [current, value];
      }
      return;
    }
    result[key] = value;
  });

  return result;
}

export function stringifyQuery(query?: QueryObject): string {
  if (!query) {
    return '';
  }

  const parts: string[] = [];

  Object.entries(query).forEach(([key, rawValue]) => {
    if (rawValue === undefined || rawValue === null) {
      return;
    }

    const encode = (value: string | number | boolean) =>
      `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;

    if (Array.isArray(rawValue)) {
      rawValue.forEach((value) => {
        if (value === null || value === undefined) {
          return;
        }
        parts.push(encode(value));
      });
      return;
    }

    parts.push(encode(rawValue));
  });

  if (!parts.length) {
    return '';
  }

  return `?${parts.join('&')}`;
}

export function buildURL(path: string, query?: NavigationLocation['query'], preserveEmptyQuery = false): string {
  const normalizedPath = normalizePath(path);
  const queryString = stringifyQuery(query ?? undefined);
  if (!queryString && !preserveEmptyQuery) {
    return normalizedPath;
  }
  return `${normalizedPath}${queryString}`;
}

export function normalizePath(path: string): string {
  if (!path) {
    return '/';
  }
  const startsWithSlash = path.startsWith('/');
  let normalized = startsWithSlash ? path : `/${path}`;
  normalized = normalized.replace(/\/{2,}/g, '/');
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized || '/';
}
