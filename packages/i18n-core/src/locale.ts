import type { Locale } from './types';

// Browser locale detection
export function detectBrowserLocale(): Locale {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return normalizeLocale(navigator.language);
  }
  return 'en'; // fallback
}

// Get user's preferred locales from browser
export function getUserLocales(): Locale[] {
  if (typeof navigator !== 'undefined' && navigator.languages) {
    return navigator.languages.map(normalizeLocale);
  }
  if (typeof navigator !== 'undefined' && navigator.language) {
    return [normalizeLocale(navigator.language)];
  }
  return ['en'];
}

// Validate if locale is supported
export function isValidLocale(locale: Locale, supported: Locale[]): boolean {
  return supported.includes(normalizeLocale(locale));
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
