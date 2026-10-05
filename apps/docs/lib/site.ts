const DEFAULT_SITE_URL = 'https://webloomframework.com';

export function normalizeSiteUrl(value: string | undefined): string {
  const candidate = value?.trim() || DEFAULT_SITE_URL;
  const url = new URL(candidate);

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`NEXT_PUBLIC_SITE_URL must use http or https: ${candidate}`);
  }

  return url.toString().replace(/\/+$/, '');
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export function absoluteUrl(path = '/'): string {
  if (path === '/' || path === '') return SITE_URL;
  return new URL(path.replace(/^\/+/, ''), `${SITE_URL}/`).toString();
}

/**
 * Package counts used in site copy. `total` is every workspace package under `packages/`
 * (a test keeps it in sync); `published` is what is on npm today: 11 `@web-loom/*` packages
 * plus the `create-web-loom` CLI. Update `published` when a package is first released.
 */
export const PACKAGE_STATS = { total: 37, published: 12 } as const;

export const SITE_DESCRIPTION = `Framework-agnostic MVVM architecture for the modern web. ${PACKAGE_STATS.total} packages. One ViewModel — React, Vue, Angular, Lit, Marko, Svelte, React Native.`;
