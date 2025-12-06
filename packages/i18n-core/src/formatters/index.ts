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
}

export { FormatterRegistry };
