// Locale type (BCP 47 format)
export type Locale = string;

// Supported locale configuration
export interface SupportedLocale {
  code: Locale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

// Translation structure (flat record of string values)
export type Translations = Record<string, string>;

// i18n configuration
export interface I18nConfig {
  defaultLocale: Locale;
  supportedLocales: SupportedLocale[];
  fallbackLocale?: Locale;
  loadTranslations?: (locale: Locale) => Promise<Translations>;
}
