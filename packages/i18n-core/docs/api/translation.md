# API Reference: Translation Management

## TranslationRegistry

Manages translations for multiple locales.

- `register(locale, translations)` — Register translations for a locale
- `get(locale, key)` — Get translation by key
- `has(locale, key)` — Check if translation exists
- `getAll(locale)` — Get all translations for a locale

## TranslationLoader

Handles lazy loading and caching of translations.

- `load(locale, loader)` — Loads and caches translations
- `clearCache(locale?)` — Clears cache for a locale or all
- `preload(locale, loader)` — Preloads translations

## createTranslator

Creates a type-safe translation function for a locale.

## createTranslatorWithFallback

Creates a translation function with fallback locale and missing key handler.

## warnMissingTranslation

Warns in development if a translation is missing.

## extractKeysFromSource

Extracts translation keys from source code.

## validateTranslations

Checks for missing/extra keys between translation files.
