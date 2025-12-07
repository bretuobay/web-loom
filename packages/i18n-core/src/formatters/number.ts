import type { Locale } from '../types';

// Number formatter with caching
class NumberFormatter {
  private cache: Map<string, Intl.NumberFormat> = new Map();

  private getFormatter(locale: Locale, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
    const key = JSON.stringify([locale, options || {}]);
    if (!this.cache.has(key)) {
      this.cache.set(key, new Intl.NumberFormat(locale, options));
    }
    return this.cache.get(key)!;
  }

  format(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
    return this.getFormatter(locale, options).format(value);
  }

  formatCurrency(value: number, locale: Locale, currency: string, options?: Intl.NumberFormatOptions): string {
    return this.getFormatter(locale, { style: 'currency', currency, ...(options || {}) }).format(value);
  }

  formatPercent(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
    return this.getFormatter(locale, { style: 'percent', ...(options || {}) }).format(value);
  }

  formatUnit(value: number, locale: Locale, unit: string, options?: Intl.NumberFormatOptions): string {
    return this.getFormatter(locale, { style: 'unit', unit, ...(options || {}) }).format(value);
  }
}

export { NumberFormatter };
