import type { Locale, SupportedLocale } from './types';

type SupportedLocaleInput = SupportedLocale | Locale;

export interface LocalePreferenceConfig {
  defaultLocale?: Locale;
  fallbackLocale?: Locale;
  supportedLocales?: SupportedLocaleInput[];
}

const DEFAULT_FALLBACK: Locale = 'en';

const toLocaleCode = (entry: SupportedLocaleInput): Locale =>
  normalizeLocale(typeof entry === 'string' ? entry : entry.code);

function getNormalizedSupportedLocales(config?: LocalePreferenceConfig): Locale[] {
  if (!config?.supportedLocales?.length) {
    return [];
  }
  return config.supportedLocales.map(toLocaleCode);
}

function resolveFallbackLocale(config?: LocalePreferenceConfig): Locale {
  if (config?.fallbackLocale) {
    return normalizeLocale(config.fallbackLocale);
  }
  if (config?.defaultLocale) {
    return normalizeLocale(config.defaultLocale);
  }
  return DEFAULT_FALLBACK;
}

function readNavigatorLocales(): Locale[] {
  if (typeof navigator === 'undefined') {
    return [];
  }
  if (Array.isArray((navigator as Navigator).languages) && navigator.languages.length > 0) {
    return navigator.languages.map(normalizeLocale);
  }
  if (navigator.language) {
    return [normalizeLocale(navigator.language)];
  }
  return [];
}

// Browser locale detection
export function detectBrowserLocale(config?: LocalePreferenceConfig): Locale {
  const locales = getUserLocales(config);
  return locales[0] ?? resolveFallbackLocale(config);
}

// Get user's preferred locales from browser
export function getUserLocales(config?: LocalePreferenceConfig): Locale[] {
  const navigatorLocales = readNavigatorLocales();
  const fallbackLocale = resolveFallbackLocale(config);
  const preferred = navigatorLocales.length > 0 ? navigatorLocales : [fallbackLocale];
  const supported = getNormalizedSupportedLocales(config);

  if (!supported.length) {
    return preferred;
  }

  const matches = preferred.filter((locale) => supported.includes(locale));
  if (matches.length) {
    return matches;
  }

  return supported.includes(fallbackLocale) ? [fallbackLocale] : [supported[0]];
}

// Validate if locale is supported
export function isValidLocale(locale: Locale, supported: SupportedLocaleInput[]): boolean {
  if (!supported.length) {
    return false;
  }
  const normalized = normalizeLocale(locale);
  return supported.some((entry) => toLocaleCode(entry) === normalized);
}

// Parse locale into components (language, region, script)

export function parseLocale(locale: Locale): {
  language: string;
  region?: string;
  script?: string;
} {
  const norm = normalizeLocale(locale);
  // Match: language-script-region (e.g., zh-Hans-CN)
  const match = /^([a-zA-Z]{2,3})(?:-([a-zA-Z]{4}))?(?:-([a-zA-Z]{2}|[0-9]{3}))?/u.exec(norm);
  return {
    language: match?.[1] || 'en',
    script: match?.[2] ? match[2][0].toUpperCase() + match[2].slice(1).toLowerCase() : undefined,
    region: match?.[3]?.toUpperCase(),
  };
}

// Normalize locale format (e.g., "en-US" not "en_US")
export function normalizeLocale(locale: Locale): Locale {
  // Replace underscores with hyphens
  let norm = locale.replace(/_/g, '-');
  // Split into subtags
  const parts = norm.split('-');
  if (parts.length === 1) {
    return parts[0].toLowerCase();
  }
  // language-script-region (e.g., zh-Hans-CN)
  const [lang, script, region] = parts;
  let result = lang ? lang.toLowerCase() : '';
  if (script) {
    // Script: capitalize first letter, rest lowercase (Hans)
    result +=
      '-' + (script.length === 4 ? script[0].toUpperCase() + script.slice(1).toLowerCase() : script.toUpperCase());
  }
  if (region) {
    result += '-' + region.toUpperCase();
  }
  // If more than 3 parts, join the rest as-is (for extensions)
  if (parts.length > 3) {
    result += '-' + parts.slice(3).join('-');
  }
  return result;
}
