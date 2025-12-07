import type { Locale } from './types';

// Simple store for current locale
export class LocaleStore {
  private currentLocale: Locale;
  private subscribers: Set<(locale: Locale) => void> = new Set();

  constructor(initialLocale: Locale) {
    this.currentLocale = initialLocale;
  }

  setLocale(locale: Locale): void {
    if (this.currentLocale !== locale) {
      this.currentLocale = locale;
      this.subscribers.forEach((cb) => cb(locale));
    }
  }

  getLocale(): Locale {
    return this.currentLocale;
  }

  subscribe(callback: (locale: Locale) => void): () => void {
    this.subscribers.add(callback);
    callback(this.currentLocale);
    return () => {
      this.subscribers.delete(callback);
    };
  }
}
