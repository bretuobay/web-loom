// eslint-disable-next-line @typescript-eslint/no-require-imports
import { config } from '@repo/eslint-config/react-internal';

/** @type {import("eslint").Linter.Config} */
export default [
  {
    ignores: ['*.config.*'],
  },
  ...config,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];

// The error shows that the ESLint config file itself is being parsed by TypeScript ESLint. Let's fix this by excluding the config file from TypeScript parsing:

// eslint.config.mjs+9-0
// The issue persists because the base config might also need the tsconfigRootDir. Let's try a different approach by disabling TypeScript parsing for this specific file:

// eslint.config.mjs+5-9
// Perfect! The ESLint configuration has been updated to:

// Ignore config files (*.config.*) to prevent them from being parsed by TypeScript ESLint
// Set explicit tsconfigRootDir to import.meta.dirname for TypeScript files
// Use specific tsconfig.json path (./tsconfig.json) instead of project: true
// This should resolve the parsing error by ensuring ESLint knows exactly which TypeScript configuration to use for this package and excludes the config file itself from TypeScript parsing.
