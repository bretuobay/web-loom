import { config as baseConfig } from '@repo/eslint-config/base';
import { configs as templateCoreLintConfigs } from '@web-loom/template-core-lint';
import tsParser from '@typescript-eslint/parser';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  ...templateCoreLintConfigs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    settings: {
      'template-core': {
        partials: {
          header: 'src/templates/header.ts',
          cart: 'src/templates/cart-drawer.ts',
          palette: 'src/templates/command-palette.ts',
          confirmation: 'src/templates/confirmation-dialog.ts',
          toast: 'src/templates/toast.ts',
          'product-card': 'src/templates/storefront-source.ts',
        },
      },
    },
  },
];
