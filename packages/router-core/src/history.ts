import { normalizePath } from './query';
import { applyBase, isBrowser, normalizeBase, stripBase } from './utils';
import type { RouterMode } from './types';

export interface HistoryAdapter {
  getLocation(): string;
  push(path: string): void;
  replace(path: string): void;
  listen(listener: () => void): () => void;
}

export function createHistory(mode: RouterMode, base: string): HistoryAdapter {
  const normalizedBase = normalizeBase(base);
  if (mode === 'hash') {
    return createHashHistory(normalizedBase);
  }
  return createBrowserHistory(normalizedBase);
}

function createBrowserHistory(base: string): HistoryAdapter {
  return {
    getLocation() {
      if (!isBrowser) {
        return '/';
      }
      const pathname = stripBase(window.location.pathname, base);
      const search = window.location.search || '';
      return `${normalizePath(pathname)}${search}`;
    },
    push(path: string) {
      if (!isBrowser) {
        return;
      }
      window.history.pushState({}, '', applyBase(path, base));
    },
    replace(path: string) {
      if (!isBrowser) {
        return;
      }
      window.history.replaceState({}, '', applyBase(path, base));
    },
    listen(listener: () => void) {
      if (!isBrowser) {
        return () => {};
      }
      const handler = () => listener();
      window.addEventListener('popstate', handler);
      return () => window.removeEventListener('popstate', handler);
    },
  };
}

function createHashHistory(base: string): HistoryAdapter {
  return {
    getLocation() {
      if (!isBrowser) {
        return '/';
      }
      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
      const [rawPath, query = ''] = hash.split('?');
      const prefixedPath = rawPath ? (rawPath.startsWith('/') ? rawPath : `/${rawPath}`) : '/';
      const stripped = stripBase(prefixedPath, base);
      const normalizedPath = normalizePath(stripped);
      return query ? `${normalizedPath}?${query}` : normalizedPath;
    },
    push(path: string) {
      if (!isBrowser) {
        return;
      }
      const target = applyBase(path, base);
      window.location.hash = target;
    },
    replace(path: string) {
      if (!isBrowser) {
        return;
      }
      const target = applyBase(path, base);
      const url = new URL(window.location.href);
      url.hash = target;
      window.history.replaceState({}, '', url);
    },
    listen(listener: () => void) {
      if (!isBrowser) {
        return () => {};
      }
      const handler = () => listener();
      window.addEventListener('hashchange', handler);
      return () => window.removeEventListener('hashchange', handler);
    },
  };
}
