import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', '.turbo/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off',
    },
  },
];
