import type { Locale } from '../types';

// List formatter with caching
class ListFormatter {
  private cache: Map<string, Intl.ListFormat> = new Map();

  private getFormatter(locale: Locale, options?: Intl.ListFormatOptions): Intl.ListFormat {
    const key = JSON.stringify([locale, options || {}]);
    if (!this.cache.has(key)) {
      this.cache.set(key, new Intl.ListFormat(locale, options));
    }
    return this.cache.get(key)!;
  }

  format(items: string[], locale: Locale, options?: Intl.ListFormatOptions): string {
    return this.getFormatter(locale, options).format(items);
  }
}

export { ListFormatter };
