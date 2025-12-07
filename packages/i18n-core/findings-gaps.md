Locale detection/manipulation ignores the I18nConfig.supportedLocales and fallbackLocale, so detectBrowserLocale/getUserLocales can return a locale string that isn’t registered (hard-coded 'en' fallback) and isValidLocale simply includes the caller-provided list without normalizing it first, which doesn’t meet Phase 1’s “locale detection and management” requirement (packages/i18n-core/src/locale.ts (lines 4-41)). Consider normalizing the supported list up-front, intersecting the browser-preferred locales with that list, and falling back to fallbackLocale ?? defaultLocale.

Phase 2’s “type-safe translation keys” promise isn’t delivered: TranslationKey is declared but never used, TranslationRegistry.get/has only work on shallow keyof T, and createTranslator returns a string only when the stored value already is a plain string, so nested keys (the common structure implied by the PRD) can’t be resolved or type-checked, breaking IntelliSense/autocomplete guarantees (packages/i18n-core/src/translations/registry.ts (lines 4-27), packages/i18n-core/src/translations/t.ts (lines 5-41)). Implement a recursive key-path utility (e.g., type Path<T> = ...) and have the translator resolve dot-paths within nested Translations.

Missing-translation handling exists only on paper: createTranslator silently returns '', createTranslatorWithFallback only tries a fallback locale but still swallows failures, and the development helper warnMissingTranslation is never called, so devs don’t get the “missing translations are clearly marked” behavior described in Phase 2 (packages/i18n-core/src/translations/t.ts (lines 28-41), packages/i18n-core/src/translations/dev.ts (lines 3-47)). Wire the translator to call warnMissingTranslation (and/or invoke an injected handler) whenever both the primary and fallback locales miss, and allow the handler to decide what to render.

The lazy TranslationLoader caches resolved values but doesn’t deduplicate in-flight requests, handle loader errors, or protect preload from dangling unhandled rejections, so repeated calls can trigger duplicate network calls and rejected promises bubble to the console—violating the “lazy loading works with proper error handling” criterion (packages/i18n-core/src/translations/loader.ts (lines 8-30)). Track pending promises per locale, return the same promise to concurrent callers, and wrap preload in void loader().then(...).catch(...) so preload failures can be surfaced to a callback.
Formatter registry doesn’t actually centralize locale-aware formatters: each formatter method requires the caller to pass a locale manually, so FormatterRegistry#setLocale never influences subsequent formatting, and DateFormatter.formatDate/formatTime always overwrite caller-provided dateStyle/timeStyle plus formatRelative builds a new Intl.RelativeTimeFormat every call instead of reusing the existing cache, missing the Phase 3 caching and ergonomics goals (packages/i18n-core/src/formatters/index.ts (lines 3-32), packages/i18n-core/src/formatters/date.ts (lines 15-45)). Have registry methods derive the locale from this.\_locale, treat user options as primary ({ dateStyle: 'medium', ...options } instead of overwriting), and cache RelativeTimeFormat instances alongside DateTimeFormat.

Packaging and validation gaps undermine the “zero dependencies / tested core” requirement: the published package currently declares a hard runtime dependency on next (58 MB+) even though the PRD forbids third-party dependencies in the core (packages/i18n-core/package.json (lines 1-58)), and the Vitest suite only covers locale/formatter/store behavior (e.g., packages/i18n-core/src/**tests**/dateFormatter.test.ts (lines 1-24))—there are no tests for translation registry/loader/dev utilities, so Phase 2 success criteria aren’t enforced. Remove the next dependency (and consider switching to the tsup build in the spec) and add tests that exercise translation key typing, lazy loading, and missing-key reporting.

## Open Questions

Should translations remain nested objects resolved at runtime, or is there an expectation to flatten them during build time? This affects how a path-typing helper should work and whether runtime lookups should traverse dot-notation.

Answer: [ No nested translations]

Do we want the formatter registry to own locale state (mirroring LocaleStore) or should the formatters stay stateless helpers? Clarifying that will guide whether FormatterRegistry should expose locale-bound formatter methods or merely provide constructors.

Answer: [ Use the best approach, that is easy and still useful ]

## Change Summary

Review only; no code changes were made.
