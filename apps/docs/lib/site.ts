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
