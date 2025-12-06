import type { Locale, Translations } from '../types';

// Translation loader with caching
class TranslationLoader {
  private cache: Map<Locale, Translations> = new Map();

  // Load translations with caching
  async load(locale: Locale, loader: () => Promise<Translations>): Promise<Translations> {
    if (this.cache.has(locale)) {
      return this.cache.get(locale)!;
    }
    const translations = await loader();
    this.cache.set(locale, translations);
    return translations;
  }

  // Clear cache for locale
  clearCache(locale?: Locale): void {
    if (locale) {
      this.cache.delete(locale);
    } else {
      this.cache.clear();
    }
  }

  // Preload translations
  preload(locale: Locale, loader: () => Promise<Translations>): void {
    loader().then((translations) => {
      this.cache.set(locale, translations);
    });
  }
}

export { TranslationLoader };
