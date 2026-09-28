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
          'app-shell': 'src/templates/app-shell.ts',
          header: 'src/templates/header.loom',
          cart: 'src/templates/cart-drawer.ts',
          palette: 'src/templates/command-palette.ts',
          confirmation: 'src/templates/confirmation-dialog.ts',
          toast: 'src/templates/toast.ts',
          'product-card': 'src/templates/storefront-source.ts',
        },
        partialProps: {
          header: ['theme', 'cartCount', 'onNavigate', 'onOpenPalette', 'onToggleTheme', 'onOpenCart'],
          cart: [
            'open',
            'items',
            'itemCount',
            'subtotalCents',
            'formatMoney',
            'onClose',
            'onUpdateQuantity',
            'onRemove',
            'onClear',
            'onCheckout',
          ],
          palette: ['palette', 'onClose', 'onStop', 'onQuery', 'onKey', 'onExecute'],
          confirmation: ['pending', 'onCancel', 'onConfirm', 'onStop'],
          toast: ['message'],
          'product-card': ['product', 'formatMoney', 'onSelect', 'onAdd', 'selected'],
        },
      },
    },
  },
];
