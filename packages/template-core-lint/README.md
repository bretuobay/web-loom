# @web-loom/template-core-lint

ESLint flat-config plugin for static analysis of `@web-loom/template-core` templates inside
`compile(\`...\`)` call sites.

Uses `analyzeTemplate()` from `@web-loom/template-core/compiler-node` (M0) and the shared
AST scanner from `@web-loom/template-core-tooling` — no second parser.

## Rules

| Rule                                     | Default | Diagnostic codes                                                            |
| ---------------------------------------- | ------- | --------------------------------------------------------------------------- |
| `template-core/no-raw-html`              | warn    | `RAW_HTML_UNSANITIZED`                                                      |
| `template-core/no-unsafe-url`            | warn    | `UNSAFE_URL_SCHEME`                                                         |
| `template-core/no-missing-partial`       | error   | `MISSING_PARTIAL` (only when `settings.template-core.partials` is set)      |
| `template-core/no-invalid-partial-props` | warn    | `MISSING_PARTIAL_PROP`, `UNKNOWN_PARTIAL_PROP` (when `partialProps` is set) |
| `template-core/no-invalid-expression`    | error   | `INVALID_EXPRESSION`, `INVALID_TEMPLATE`                                    |
| `template-core/no-unsupported-modifier`  | error   | `MODIFIER_CONFLICT`, `UNSUPPORTED_DIRECTIVE`                                |

Only **static** `compile(\`literal\`)` call sites are checked (same scope as the Vite plugin).

## Usage

```js
// eslint.config.js
import templateCoreLint from '@web-loom/template-core-lint';

export default [
  ...templateCoreLint.configs.recommended,
  {
    settings: {
      'template-core': {
        partials: {
          header: 'src/templates/header.ts',
          'product-card': 'src/templates/storefront-source.ts',
        },
        partialProps: {
          'product-card': ['product', 'formatMoney', 'onSelect', 'onAdd', 'selected'],
        },
      },
    },
  },
];
```

Partial manifest values are documentation paths — only **keys** are used for resolution checks.
`partialProps` lists the hash args each named child accepts (`{{> card count=n href=path}}`).

## TypeScript sources

Use `@typescript-eslint/parser` (or `typescript-eslint` flat config) so ESLint can parse `.ts`/`.tsx`
files containing `compile()` calls.

See the [tooling cookbook](../template-core/docs/template-core-tooling.md) §7 for a full CI setup
using `apps/ecommerce-template-core` as reference.
