# Product Requirements Document: @web-loom/i18n-core

## Overview

A lightweight, TypeScript-based internationalization core library that provides a friendly wrapper around browser-native Intl APIs. Framework-agnostic utilities for managing translations, formatting, and locale detection in modern web applications.

**Core Principles:**

- Use browser standards (Intl API) as much as possible
- Type-safe translation keys
- Zero third-party dependencies
- Framework-agnostic design
- Cross-browser compatible APIs only
- Lightweight wrapper, not a reimplementation

---

## Phase 1: Core Types and Locale Management

### Objectives

- Define foundational TypeScript types and interfaces
- Implement locale detection and management
- Create basic translation structure

### Requirements

#### 1.1 Core Types (`src/types.ts`)

```typescript
// Locale type (BCP 47 format)
type Locale = string;

// Supported locale configuration
interface SupportedLocale {
  code: Locale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

// Translation structure
interface Translations {
  [key: string]: string | Translations;
}

// i18n configuration
interface I18nConfig {
  defaultLocale: Locale;
  supportedLocales: SupportedLocale[];
  fallbackLocale?: Locale;
  loadTranslations?: (locale: Locale) => Promise<Translations>;
}
```

#### 1.2 Locale Detection (`src/locale.ts`)

```typescript
// Browser locale detection
function detectBrowserLocale(): Locale;

// Get user's preferred locales from browser
function getUserLocales(): Locale[];

// Validate if locale is supported
function isValidLocale(locale: Locale, supported: Locale[]): boolean;

// Parse locale into components (language, region, script)
function parseLocale(locale: Locale): {
  language: string;
  region?: string;
  script?: string;
};

// Normalize locale format (e.g., "en-US" not "en_US")
function normalizeLocale(locale: Locale): Locale;
```

#### 1.3 Locale Store (`src/store.ts`)

```typescript
// Simple store for current locale
class LocaleStore {
  private currentLocale: Locale;

  setLocale(locale: Locale): void;
  getLocale(): Locale;
  subscribe(callback: (locale: Locale) => void): () => void;
}
```

#### 1.4 RTL Detection (`src/rtl.ts`)

```typescript
// Check if locale is RTL
function isRTL(locale: Locale): boolean;

// Get text direction for locale
function getTextDirection(locale: Locale): 'ltr' | 'rtl';
```

#### 1.5 Export Structure (`src/index.ts`)

```typescript
export type { Locale, SupportedLocale, Translations, I18nConfig };
export { detectBrowserLocale, getUserLocales, isValidLocale };
export { LocaleStore };
export { isRTL, getTextDirection };
```

### Success Criteria

- Types provide full TypeScript intellisense
- Locale detection works in all modern browsers
- No external dependencies
- Bundle size < 2KB gzipped

---

## Phase 2: Translation Management

### Objectives

- Type-safe translation keys
- Lazy loading support
- Missing translation handling

### Requirements

#### 2.1 Translation Registry (`src/translations/registry.ts`)

```typescript
// Type-safe translation keys
type TranslationKey<T extends Translations> = string & { __type: T };

// Translation registry
class TranslationRegistry<T extends Translations = Translations> {
  private translations: Map<Locale, T> = new Map();

  // Register translations for a locale
  register(locale: Locale, translations: T): void;

  // Get translation by key
  get<Key extends keyof T>(locale: Locale, key: Key): T[Key] | undefined;

  // Check if translation exists
  has(locale: Locale, key: keyof T): boolean;

  // Get all translations for a locale
  getAll(locale: Locale): T | undefined;
}
```

#### 2.2 Lazy Loading (`src/translations/loader.ts`)

```typescript
// Translation loader with caching
class TranslationLoader {
  private cache: Map<Locale, Translations> = new Map();

  // Load translations with caching
  async load(locale: Locale, loader: () => Promise<Translations>): Promise<Translations>;

  // Clear cache for locale
  clearCache(locale?: Locale): void;

  // Preload translations
  preload(locale: Locale, loader: () => Promise<Translations>): void;
}
```

#### 2.3 Translation Function (`src/translations/t.ts`)

```typescript
// Create type-safe translation function
function createTranslator<T extends Translations>(
  registry: TranslationRegistry<T>,
  locale: Locale,
): (key: keyof T, params?: Record<string, unknown>) => string;

// Missing translation handler
type MissingTranslationHandler = (locale: Locale, key: string, params?: Record<string, unknown>) => string;

// Create translator with missing key handling
function createTranslatorWithFallback<T extends Translations>(
  registry: TranslationRegistry<T>,
  locale: Locale,
  fallbackLocale: Locale,
  onMissing?: MissingTranslationHandler,
): (key: keyof T, params?: Record<string, unknown>) => string;
```

#### 2.4 Development Utilities (`src/translations/dev.ts`)

```typescript
// Warn about missing translations in development
function warnMissingTranslation(locale: Locale, key: string, params?: Record<string, unknown>): void;

// Extract translation keys from source code
function extractKeysFromSource(code: string): string[];

// Validate translation files for missing keys
function validateTranslations<T extends Translations>(
  baseLocale: Locale,
  baseTranslations: T,
  targetLocale: Locale,
  targetTranslations: T,
): { missing: string[]; extra: string[] };
```

### Success Criteria

- TypeScript shows autocomplete for translation keys
- Lazy loading works with proper error handling
- Missing translations are clearly marked in dev mode
- Bundle size increase < 3KB gzipped

---

## Phase 3: Formatters (Intl API Wrappers)

### Objectives

- Friendly wrappers for Intl formatters
- Consistent caching and reuse
- Type-safe formatting options

### Requirements

#### 3.1 Number Formatting (`src/formatters/number.ts`)

```typescript
// Number formatter with caching
class NumberFormatter {
  private cache: Map<string, Intl.NumberFormat> = new Map();

  format(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string;

  formatCurrency(value: number, locale: Locale, currency: string, options?: Intl.NumberFormatOptions): string;

  formatPercent(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string;

  formatUnit(value: number, locale: Locale, unit: string, options?: Intl.NumberFormatOptions): string;
}
```

#### 3.2 Date/Time Formatting (`src/formatters/date.ts`)

```typescript
// Date formatter with caching
class DateFormatter {
  private cache: Map<string, Intl.DateTimeFormat> = new Map();

  format(date: Date | string | number, locale: Locale, options?: Intl.DateTimeFormatOptions): string;

  formatDate(date: Date | string | number, locale: Locale, options?: Intl.DateTimeFormatOptions): string;

  formatTime(date: Date | string | number, locale: Locale, options?: Intl.DateTimeFormatOptions): string;

  formatRelative(date: Date | string | number, locale: Locale, options?: Intl.RelativeTimeFormatOptions): string;
}
```

#### 3.3 List Formatting (`src/formatters/list.ts`)

```typescript
// List formatter with caching
class ListFormatter {
  private cache: Map<string, Intl.ListFormat> = new Map();

  format(items: string[], locale: Locale, options?: Intl.ListFormatOptions): string;
}
```

#### 3.4 Plural Rules (`src/formatters/plural.ts`)

```typescript
// Plural rules wrapper
class PluralRules {
  private cache: Map<string, Intl.PluralRules> = new Map();

  select(value: number, locale: Locale, options?: Intl.PluralRulesOptions): Intl.LDMLPluralRule;

  // Convert ICU plural syntax to Intl
  format(value: number, locale: Locale, forms: Record<string, string>, options?: Intl.PluralRulesOptions): string;
}
```

#### 3.5 Formatter Registry (`src/formatters/index.ts`)

```typescript
// Central formatter registry
class FormatterRegistry {
  readonly number: NumberFormatter;
  readonly date: DateFormatter;
  readonly list: ListFormatter;
  readonly plural: PluralRules;

  constructor(defaultLocale: Locale);

  setLocale(locale: Locale): void;
}
```

### Success Criteria

- All Intl APIs properly wrapped with caching
- Type-safe options for all formatters
- Consistent error handling for invalid inputs
- Bundle size increase < 5KB gzipped

---

## Phase 4: Framework Integration Patterns

### Objectives

- Provide patterns for framework integration
- React/Vue/Svelte examples
- State management integration

### Requirements

#### 4.1 React Integration Example (`examples/react/useI18n.ts`)

```typescript
// React hook for i18n
function useI18n(config: I18nConfig) {
  const [locale, setLocale] = useState<Locale>(config.defaultLocale);
  const [translations, setTranslations] = useState<Translations>({});

  // Implementation using our core library
  // Shows how to integrate with React state
}

// React context provider
const I18nContext = createContext(/* ... */);

// React component for locale switching
function LocaleSwitcher() {
  /* ... */
}
```

#### 4.2 Vue Integration Example (`examples/vue/useI18n.ts`)

```typescript
// Vue composable for i18n
export function useI18n(config: I18nConfig) {
  const locale = ref(config.defaultLocale);
  const translations = ref({});

  // Implementation using our core library
  // Shows how to integrate with Vue reactivity
}
```

#### 4.3 Svelte Integration Example (`examples/svelte/i18nStore.ts`)

```typescript
// Svelte store for i18n
function createI18nStore(config: I18nConfig) {
  const locale = writable(config.defaultLocale);
  const translations = writable({});

  // Implementation using our core library
  // Shows how to integrate with Svelte stores
}
```

#### 4.4 Framework-Agnostic Patterns (`examples/patterns/`)

```typescript
// Event-based locale changes
class I18nEventEmitter {
  onLocaleChange(callback: (locale: Locale) => void): () => void;
  emitLocaleChange(locale: Locale): void;
}

// Observable pattern
class ObservableI18n {
  readonly locale$: Observable<Locale>;
  readonly translations$: Observable<Translations>;
}

// Simple singleton pattern (for small apps)
const i18n = createI18nInstance(config);
```

#### 4.5 Build Integration (`examples/build/`)

```typescript
// Vite plugin example for translation extraction
// Webpack loader example
// TypeScript transformer for key validation
```

### Success Criteria

- Clear, copy-pasteable examples for major frameworks
- Zero framework dependencies in core library
- Proper separation of concerns
- Comprehensive documentation

---

## Phase 5: Documentation and Examples

### Objectives

- Complete API documentation
- Real-world usage examples
- Performance guidelines

### Requirements

#### 5.1 API Documentation (`docs/api/`)

```markdown
# API Reference

## Core Functions

- `detectBrowserLocale()` - Explanation and examples
- `getUserLocales()` - Usage patterns

## Formatters

- `NumberFormatter` - All methods with examples
- `DateFormatter` - Formatting patterns
```

#### 5.2 Guides (`docs/guides/`)

```markdown
# Getting Started

1. Installation
2. Basic setup
3. Adding translations

# Advanced Usage

1. Lazy loading strategies
2. TypeScript configuration
3. Performance optimization

# Framework Integration

1. React setup
2. Vue setup
3. Svelte setup
```

#### 5.3 Examples (`examples/`)

```typescript
// Basic usage
// Advanced usage with lazy loading
// Server-side rendering
// Testing strategies
```

#### 5.4 Performance Guidelines (`docs/performance.md`)

```markdown
# Bundle Optimization

- Tree shaking
- Dynamic imports
- Caching strategies

# Runtime Performance

- Formatter caching
- Memory management
- Update strategies
```

#### 5.5 Migration Guide (`docs/migration.md`)

```markdown
# From other i18n libraries

- i18next
- vue-i18n
- Format.js
```

### Success Criteria

- Full TypeDoc/TSDoc coverage
- Interactive examples
- Performance benchmarks
- Migration assistance

---

## Technical Specifications

### Development Setup

```json
{
  "name": "@web-loom/i18n-core",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "test": "vitest",
    "type-check": "tsc --noEmit"
  }
}
```

### Bundle Requirements

- Target: ES2020
- Module: ES Modules
- No polyfills (rely on browser support)
- Tree-shakeable exports

### Browser Support

- Chrome/Edge 76+
- Firefox 78+
- Safari 14+
- (All browsers supporting Intl API)

### Testing Strategy

- Unit tests: Vitest
- Type tests: tsd
- Browser tests: Playwright (optional)
- Bundle size: bundle-size action

---

## Success Metrics

### Phase Completion Criteria

1. **Phase 1**: Core types pass TypeScript strict mode, locale detection works in target browsers
2. **Phase 2**: Translation keys are type-safe, lazy loading works with error boundaries
3. **Phase 3**: All Intl APIs wrapped with proper caching, no memory leaks
4. **Phase 4**: Framework examples compile and run without errors
5. **Phase 5**: Documentation covers 100% of public API, examples are runnable

### Performance Targets

- Core bundle: < 3KB gzipped
- Full library: < 8KB gzipped
- Zero dependencies
- Cold start: < 50ms locale detection
- Formatting: < 1ms cached, < 5ms uncached

### Quality Gates

- 100% TypeScript coverage for public API
- 90%+ test coverage
- No `any` types in public API
- All exports documented
- Cross-browser compatibility verified

---

## Dependencies & Constraints

### Allowed

- TypeScript (dev only)
- Vite/Vitest (dev only)
- Browser-native APIs (Intl, etc.)

### Forbidden

- Third-party i18n libraries
- Polyfills (except documented exceptions)
- Framework-specific code in core
- Node.js-specific APIs

### Configuration

- ESLint with strict rules
- Prettier for formatting
- GitHub Actions for CI
- Changesets for versioning

---

## Delivery Timeline

**Phase 1-2**: Week 1-2 (Core functionality)
**Phase 3**: Week 3 (Formatters)
**Phase 4**: Week 4 (Examples)
**Phase 5**: Week 5 (Documentation)

Each phase is independently deliverable and can be tested in isolation. The LLM agent should implement each phase as a separate PR with:

1. Implementation code
2. Unit tests
3. Type tests
4. Basic documentation
5. Bundle size report

---

## Notes for Implementation Agent

1. **Keep it simple**: This is a wrapper, not a reimplementation
2. **Use Intl API**: Leverage browser capabilities
3. **TypeScript first**: Design for type safety
4. **Framework-agnostic**: No React/Vue/Svelte specifics in core
5. **Lightweight**: Every KB matters
6. **Document as you go**: Comments for public APIs
7. **Test edge cases**: Especially around locale parsing
8. **Consider SSR**: But don't overcomplicate for phase 1
9. **Error handling**: Graceful degradation where possible
10. **Performance**: Cache formatters, avoid object creation in hot paths

The goal is to create a minimal, robust foundation that can be extended by framework-specific packages later (e.g., `@web-loom/i18n-react`, `@web-loom/i18n-vue`).
