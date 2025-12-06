// Observable pattern (framework-agnostic)
import type { Locale, Translations } from '../../src/types';

export class ObservableI18n {
  private _locale: Locale;
  private _translations: Translations;
  private localeListeners: Set<(l: Locale) => void> = new Set();
  private translationListeners: Set<(t: Translations) => void> = new Set();

  constructor(locale: Locale, translations: Translations) {
    this._locale = locale;
    this._translations = translations;
  }

  get locale$() {
    return {
      subscribe: (cb: (l: Locale) => void) => {
        this.localeListeners.add(cb);
        cb(this._locale);
        return () => this.localeListeners.delete(cb);
      },
    };
  }

  get translations$() {
    return {
      subscribe: (cb: (t: Translations) => void) => {
        this.translationListeners.add(cb);
        cb(this._translations);
        return () => this.translationListeners.delete(cb);
      },
    };
  }

  setLocale(locale: Locale) {
    this._locale = locale;
    for (const cb of this.localeListeners) cb(locale);
  }

  setTranslations(t: Translations) {
    this._translations = t;
    for (const cb of this.translationListeners) cb(t);
  }
}
