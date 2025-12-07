import type { Locale, Translations } from '../types';

// Type-safe translation keys
type TranslationKey<T extends Translations> = keyof T & string;

// Translation registry
class TranslationRegistry<T extends Translations = Translations> {
  private translations: Map<Locale, T> = new Map();

  // Register translations for a locale
  register(locale: Locale, translations: T): void {
    this.translations.set(locale, translations);
  }

  // Get translation by key
  get<Key extends TranslationKey<T>>(locale: Locale, key: Key): T[Key] | undefined {
    return this.translations.get(locale)?.[key];
  }

  // Check if translation exists
  has(locale: Locale, key: TranslationKey<T>): boolean {
    return this.translations.get(locale)?.[key] !== undefined;
  }

  // Get all translations for a locale
  getAll(locale: Locale): T | undefined {
    return this.translations.get(locale);
  }
}

export type { TranslationKey };
export { TranslationRegistry };
