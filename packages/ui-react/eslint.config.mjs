// eslint-disable-next-line @typescript-eslint/no-require-imports
import { config } from '@repo/eslint-config/react-internal';

/** @type {import("eslint").Linter.Config} */
export default [
  {
    ignores: ['*.config.*', '.storybook/**/*', 'dist/**/*', 'coverage/**'],
  },
  ...config,
  {
    rules: {
      // Disable prop-types validation since we use TypeScript
      'react/prop-types': 'off',
      // Allow components without display names (handled by TypeScript)
      'react/display-name': 'off',
      // Allow any type when needed
      '@typescript-eslint/no-explicit-any': 'off',
      // Relax hook rules for story files
      'react-hooks/rules-of-hooks': 'warn',
    },
  },
];
