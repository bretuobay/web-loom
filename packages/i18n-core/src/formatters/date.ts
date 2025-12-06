import type { Locale } from '../types';

// Date formatter with caching
class DateFormatter {
  private cache: Map<string, Intl.DateTimeFormat> = new Map();
  private relativeCache: Map<string, Intl.RelativeTimeFormat> = new Map();

  private getFormatter(locale: Locale, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    const key = JSON.stringify([locale, options || {}]);
    if (!this.cache.has(key)) {
      this.cache.set(key, new Intl.DateTimeFormat(locale, options));
    }
    return this.cache.get(key)!;
  }

  private getRelativeFormatter(locale: Locale, options?: Intl.RelativeTimeFormatOptions): Intl.RelativeTimeFormat {
    const key = JSON.stringify([locale, options || {}]);
    if (!this.relativeCache.has(key)) {
      this.relativeCache.set(key, new Intl.RelativeTimeFormat(locale, options));
    }
    return this.relativeCache.get(key)!;
  }

  private normalizeDateValue(date: Date | string | number): Date {
    return date instanceof Date ? date : new Date(date);
  }

  format(date: Date | string | number, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
    return this.getFormatter(locale, options).format(this.normalizeDateValue(date));
  }

  formatDate(date: Date | string | number, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
    return this.format(date, locale, { dateStyle: 'medium', ...(options || {}) });
  }

  formatTime(date: Date | string | number, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
    return this.format(date, locale, { timeStyle: 'medium', ...(options || {}) });
  }

  formatRelative(date: Date | string | number, locale: Locale, options?: Intl.RelativeTimeFormatOptions): string {
    const now = Date.now();
    const value = this.normalizeDateValue(date).getTime();
    const diff = value - now;
    const absDiff = Math.abs(diff);
    let unit: Intl.RelativeTimeFormatUnit = 'second';
    let amount = Math.round(diff / 1000);
    if (absDiff >= 60000 && absDiff < 3600000) {
      unit = 'minute';
      amount = Math.round(diff / 60000);
    } else if (absDiff >= 3600000 && absDiff < 86400000) {
      unit = 'hour';
      amount = Math.round(diff / 3600000);
    } else if (absDiff >= 86400000) {
      unit = 'day';
      amount = Math.round(diff / 86400000);
    }
    return this.getRelativeFormatter(locale, options).format(amount, unit);
  }
}

export { DateFormatter };
