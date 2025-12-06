import type { Locale, Translations } from '../types';

// Warn about missing translations in development
function warnMissingTranslation(locale: Locale, key: string, params?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(`[i18n] Missing translation for '${key}' in locale '${locale}'`, params);
  }
}

// Extract translation keys from source code
function extractKeysFromSource(code: string): string[] {
  // Simple regex for t('key') or t("key")
  const regex = /\bt\(['"]([\w.]+)['"]\)/g;
  const keys: string[] = [];
  let match;
  while ((match = regex.exec(code))) {
    keys.push(match[1]);
  }
  return keys;
}

// Validate translation files for missing keys
function validateTranslations<T extends Translations>(
  baseLocale: Locale,
  baseTranslations: T,
  targetLocale: Locale,
  targetTranslations: T,
): { missing: string[]; extra: string[] } {
  const baseKeys = flattenKeys(baseTranslations);
  const targetKeys = flattenKeys(targetTranslations);
  return {
    missing: baseKeys.filter((k) => !targetKeys.includes(k)),
    extra: targetKeys.filter((k) => !baseKeys.includes(k)),
  };
}

// Helper to flatten nested translation keys
function flattenKeys(obj: Translations, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null) {
      return flattenKeys(v as Translations, key);
    }
    return [key];
  });
}

export { warnMissingTranslation, extractKeysFromSource, validateTranslations };
