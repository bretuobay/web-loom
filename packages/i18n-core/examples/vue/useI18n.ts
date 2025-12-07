// Vue composable for i18n integration example
import { ref, watch } from 'vue';
import type { I18nConfig, Locale, Translations } from '../../src/types';
import { LocaleStore } from '../../src/store';
import { TranslationRegistry } from '../../src/translations/registry';
import { createTranslator } from '../../src/translations/t';

export function useI18n(config: I18nConfig) {
  const locale = ref<Locale>(config.defaultLocale);
  const translations = ref<Translations>({});
  const registry = new TranslationRegistry<Translations>();

  watch(
    locale,
    async (newLocale) => {
      if (config.loadTranslations) {
        const t = await config.loadTranslations(newLocale);
        registry.register(newLocale, t);
        translations.value = t;
      }
    },
    { immediate: true },
  );

  const t = (key: keyof Translations, params?: Record<string, unknown>) => {
    return createTranslator(registry, locale.value)(key, params);
  };

  return { locale, translations, t };
}
