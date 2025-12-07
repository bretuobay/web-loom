import type { Locale, Translations } from '../types';

interface TranslationLoaderOptions {
  onError?: (locale: Locale, error: unknown) => void;
}

// Translation loader with caching
class TranslationLoader {
  private cache: Map<Locale, Translations> = new Map();
  private pending: Map<Locale, Promise<Translations>> = new Map();
  private readonly onError?: (locale: Locale, error: unknown) => void;

  constructor(options?: TranslationLoaderOptions) {
    this.onError = options?.onError;
  }

  // Load translations with caching and in-flight deduplication
  async load(locale: Locale, loader: () => Promise<Translations>): Promise<Translations> {
    if (this.cache.has(locale)) {
      return this.cache.get(locale)!;
    }
    if (this.pending.has(locale)) {
      return this.pending.get(locale)!;
    }

    const task = loader()
      .then((translations) => {
        this.cache.set(locale, translations);
        this.pending.delete(locale);
        return translations;
      })
      .catch((error) => {
        this.pending.delete(locale);
        this.onError?.(locale, error);
        throw error;
      });

    this.pending.set(locale, task);
    return task;
  }

  // Clear cache for locale
  clearCache(locale?: Locale): void {
    if (locale) {
      this.cache.delete(locale);
      this.pending.delete(locale);
      return;
    }
    this.cache.clear();
    this.pending.clear();
  }

  // Preload translations with error handling
  preload(locale: Locale, loader: () => Promise<Translations>): void {
    void this.load(locale, loader).catch(() => {
      // errors are reported through onError in load(); swallow here to avoid unhandled rejections
    });
  }
}

export { TranslationLoader };
export type { TranslationLoaderOptions };
