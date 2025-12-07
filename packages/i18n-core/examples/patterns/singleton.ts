// Simple singleton pattern (framework-agnostic)
import type { I18nConfig, Locale, Translations } from '../../src/types';
import { LocaleStore } from '../../src/store';
import { TranslationRegistry } from '../../src/translations/registry';
import { createTranslator } from '../../src/translations/t';

export function createI18nInstance(config: I18nConfig) {
  const store = new LocaleStore(config.defaultLocale);
  const registry = new TranslationRegistry<Translations>();
  let translations: Translations = {};

  async function setLocale(locale: Locale) {
    if (config.loadTranslations) {
      translations = await config.loadTranslations(locale);
      registry.register(locale, translations);
      store.setLocale(locale);
    }
  }

  const t = (key: keyof Translations, params?: Record<string, unknown>) => {
    return createTranslator(registry, store.getLocale())(key, params);
  };

  return { store, setLocale, t };
}
