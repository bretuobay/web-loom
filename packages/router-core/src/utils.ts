import type { RouteDefinition } from './types';
import { normalizePath } from './query';

export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export function normalizeBase(base?: string): string {
  if (!base) {
    return '/';
  }
  if (base === '/') {
    return base;
  }
  let normalized = base;
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  normalized = normalized.replace(/\/{2,}/g, '/');
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized || '/';
}

export function stripBase(pathname: string, base: string): string {
  if (base !== '/' && pathname.startsWith(base)) {
    const stripped = pathname.slice(base.length) || '/';
    return stripped.startsWith('/') ? stripped : `/${stripped}`;
  }
  return pathname || '/';
}

export function applyBase(pathWithQuery: string, base: string): string {
  if (base === '/') {
    return pathWithQuery;
  }
  const [path, query] = pathWithQuery.split('?');
  const normalizedPath = normalizePath(path);
  const basePath = normalizedPath === '/' ? base : `${base}${normalizedPath}`;
  return query ? `${basePath}?${query}` : basePath;
}

export function toPathSegments(path: string): string[] {
  const normalized = normalizePath(path);
  if (normalized === '/') {
    return [];
  }
  return normalized
    .split('/')
    .filter(Boolean)
    .map((segment) => tryDecodeURIComponent(segment));
}

export function tryDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function mergeMeta(stack: RouteDefinition[]): Record<string, any> {
  return stack.reduce<Record<string, any>>((acc, route) => {
    if (route.meta) {
      Object.assign(acc, route.meta);
    }
    return acc;
  }, {});
}

export function noop(): void {
  // noop
}
