import type { Locale, Translations } from '../types';
import { TranslationRegistry, type TranslationKey } from './registry';
import { warnMissingTranslation } from './dev';

// Missing translation handler
type MissingTranslationHandler = (locale: Locale, key: string, params?: Record<string, unknown>) => string;

interface TranslatorOptions {
  onMissing?: MissingTranslationHandler;
}

// Create type-safe translation function
function createTranslator<T extends Translations>(
  registry: TranslationRegistry<T>,
  locale: Locale,
  options?: TranslatorOptions,
): (key: TranslationKey<T>, params?: Record<string, unknown>) => string {
  return (key, params) => {
    const value = registry.get(locale, key);
    if (typeof value === 'string') {
      return interpolate(value, params);
    }
    return handleMissing(locale, String(key), params, options?.onMissing);
  };
}

// Create translator with missing key handling
function createTranslatorWithFallback<T extends Translations>(
  registry: TranslationRegistry<T>,
  locale: Locale,
  fallbackLocale: Locale,
  onMissing?: MissingTranslationHandler,
): (key: TranslationKey<T>, params?: Record<string, unknown>) => string {
  return (key, params) => {
    const primary = registry.get(locale, key);
    if (typeof primary === 'string') {
      return interpolate(primary, params);
    }
    const fallback = registry.get(fallbackLocale, key);
    if (typeof fallback === 'string') {
      return interpolate(fallback, params);
    }
    return handleMissing(locale, String(key), params, onMissing);
  };
}

function handleMissing(
  locale: Locale,
  key: string,
  params: Record<string, unknown> | undefined,
  onMissing?: MissingTranslationHandler,
): string {
  if (onMissing) {
    return onMissing(locale, key, params);
  }
  warnMissingTranslation(locale, key, params);
  return '';
}

// Simple interpolation: replaces {param} with params[param]
function interpolate(str: string, params?: Record<string, unknown>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? String(params[k]) : ''));
}

export { createTranslator, createTranslatorWithFallback };
export type { MissingTranslationHandler, TranslatorOptions };
