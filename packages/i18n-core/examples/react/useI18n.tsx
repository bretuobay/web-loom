// React hook for i18n integration example
import { useState, useEffect, createContext, useContext } from 'react';
import type { I18nConfig, Locale, Translations } from '../../src/types';
import { LocaleStore } from '../../src/store';
import { TranslationRegistry } from '../../src/translations/registry';
import { createTranslator } from '../../src/translations/t';

export function useI18n(config: I18nConfig) {
  const [locale, setLocale] = useState<Locale>(config.defaultLocale);
  const [translations, setTranslations] = useState<Translations>({});
  const registry = new TranslationRegistry<Translations>();

  useEffect(() => {
    if (config.loadTranslations) {
      config.loadTranslations(locale).then((t) => {
        registry.register(locale, t);
        setTranslations(t);
      });
    }
  }, [locale]);

  const t = createTranslator(registry, locale);

  return { locale, setLocale, translations, t };
}

export const I18nContext = createContext<any>(null);

export function LocaleSwitcher({ locales, onChange }: { locales: Locale[]; onChange: (l: Locale) => void }) {
  return (
    <select onChange={(e) => onChange(e.target.value)}>
      {locales.map((l) => (
        <option key={l} value={l}>
          {l}
        </option>
      ))}
    </select>
  );
}
