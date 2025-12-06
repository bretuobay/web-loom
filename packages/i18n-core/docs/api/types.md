# API Reference: Types

## Locale

A string representing a BCP 47 locale code (e.g., "en-US", "fr-FR").

## SupportedLocale

```typescript
interface SupportedLocale {
  code: Locale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}
```

## Translations

A nested object mapping translation keys to strings or further nested objects.

## I18nConfig

```typescript
interface I18nConfig {
  defaultLocale: Locale;
  supportedLocales: SupportedLocale[];
  fallbackLocale?: Locale;
  loadTranslations?: (locale: Locale) => Promise<Translations>;
}
```
