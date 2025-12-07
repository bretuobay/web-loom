# @web-loom/i18n-core

A lightweight, framework-agnostic internationalization (i18n) core library for modern web applications. Provides type-safe translation management, locale detection, and friendly wrappers around browser-native Intl APIs.

## Features

- Type-safe translation keys
- Locale detection and management
- Lazy loading and caching of translations
- RTL detection
- Intl formatters (number, date, list, plural)
- No dependencies, cross-browser compatible
- Designed for integration with React, Vue, Svelte, Angular, and more

## Installation

```bash
npm install @web-loom/i18n-core
```

## Quick Start

```typescript
import { LocaleStore, TranslationRegistry, createTranslator } from '@web-loom/i18n-core';

const store = new LocaleStore('en-US');
const registry = new TranslationRegistry();
registry.register('en-US', { hello: 'Hello' });
const t = createTranslator(registry, store.getLocale());
console.log(t('hello')); // "Hello"
```

## API Documentation

- [API Reference](./docs/api/README.md)
- [Guides](./docs/guides/getting-started.md)
- [Performance](./docs/performance/performance.md)
- [Migration](./docs/migration/migration.md)

## Framework Integration

- [React Guide](./docs/guides/react.md)
- [Vue Guide](./docs/guides/vue.md)
- [Svelte Guide](./docs/guides/svelte.md)
- [Framework-Agnostic Patterns](./docs/guides/framework-agnostic.md)

## Examples

- [Basic usage](./examples/basic.ts)
- [Build integration (Vite plugin)](./examples/build/vite-plugin.js)

## License

MIT
