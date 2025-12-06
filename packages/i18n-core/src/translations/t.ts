import type { Locale, Translations } from '../types';
import { TranslationRegistry } from './registry';

// Create type-safe translation function
function createTranslator<T extends Translations>(
  registry: TranslationRegistry<T>,
  locale: Locale,
): (key: keyof T, params?: Record<string, unknown>) => string {
  return (key, params) => {
    const value = registry.get(locale, key);
    if (typeof value === 'string') {
      return interpolate(value, params);
    }
    return '';
  };
}

// Missing translation handler
type MissingTranslationHandler = (locale: Locale, key: string, params?: Record<string, unknown>) => string;

// Create translator with missing key handling
function createTranslatorWithFallback<T extends Translations>(
  registry: TranslationRegistry<T>,
  locale: Locale,
  fallbackLocale: Locale,
  onMissing?: MissingTranslationHandler,
): (key: keyof T, params?: Record<string, unknown>) => string {
  return (key, params) => {
    let value = registry.get(locale, key);
    if (typeof value === 'string') {
      return interpolate(value, params);
    }
    value = registry.get(fallbackLocale, key);
    if (typeof value === 'string') {
      return interpolate(value, params);
    }
    if (onMissing) {
      return onMissing(locale, String(key), params);
    }
    return '';
  };
}

// Simple interpolation: replaces {param} with params[param]
function interpolate(str: string, params?: Record<string, unknown>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? String(params[k]) : ''));
}

export { createTranslator, createTranslatorWithFallback };
export type { MissingTranslationHandler };
