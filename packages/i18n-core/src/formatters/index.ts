import type { Locale } from '../types';
import { NumberFormatter } from './number';
import { DateFormatter } from './date';
import { ListFormatter } from './list';
import { PluralRules } from './plural';

// Central formatter registry
class FormatterRegistry {
  readonly number: NumberFormatter;
  readonly date: DateFormatter;
  readonly list: ListFormatter;
  readonly plural: PluralRules;
  private _locale: Locale;

  constructor(defaultLocale: Locale) {
    this._locale = defaultLocale;
    this.number = new NumberFormatter();
    this.date = new DateFormatter();
    this.list = new ListFormatter();
    this.plural = new PluralRules();
  }

  setLocale(locale: Locale): void {
    this._locale = locale;
  }

  get locale(): Locale {
    return this._locale;
  }

  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return this.number.format(value, this._locale, options);
  }

  formatCurrency(value: number, currency: string, options?: Intl.NumberFormatOptions): string {
    return this.number.formatCurrency(value, this._locale, currency, options);
  }

  formatPercent(value: number, options?: Intl.NumberFormatOptions): string {
    return this.number.formatPercent(value, this._locale, options);
  }

  formatUnit(value: number, unit: string, options?: Intl.NumberFormatOptions): string {
    return this.number.formatUnit(value, this._locale, unit, options);
  }

  formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    return this.date.formatDate(date, this._locale, options);
  }

  formatTime(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    return this.date.formatTime(date, this._locale, options);
  }

  formatRelative(date: Date | string | number, options?: Intl.RelativeTimeFormatOptions): string {
    return this.date.formatRelative(date, this._locale, options);
  }

  //   formatList(items: string[], options?: Intl.ListFormatOptions): string {
  //     return this.list.format(items, this._locale, options);
  //   }

  selectPlural(value: number, options?: Intl.PluralRulesOptions): Intl.LDMLPluralRule {
    return this.plural.select(value, this._locale, options);
  }

  formatPlural(value: number, forms: Record<string, string>, options?: Intl.PluralRulesOptions): string {
    return this.plural.format(value, this._locale, forms, options);
  }
}

export { FormatterRegistry };
