import type { Locale } from '../types';

// Plural rules wrapper
class PluralRules {
  private cache: Map<string, Intl.PluralRules> = new Map();

  private getFormatter(locale: Locale, options?: Intl.PluralRulesOptions): Intl.PluralRules {
    const key = JSON.stringify([locale, options || {}]);
    if (!this.cache.has(key)) {
      this.cache.set(key, new Intl.PluralRules(locale, options));
    }
    return this.cache.get(key)!;
  }

  select(value: number, locale: Locale, options?: Intl.PluralRulesOptions): Intl.LDMLPluralRule {
    return this.getFormatter(locale, options).select(value);
  }

  // Convert ICU plural syntax to Intl
  format(value: number, locale: Locale, forms: Record<string, string>, options?: Intl.PluralRulesOptions): string {
    const rule = this.select(value, locale, options);
    return forms[rule] ?? forms.other ?? '';
  }
}

export { PluralRules };
