// eslint-disable-next-line @typescript-eslint/no-require-imports
import { config } from '@repo/eslint-config/react-internal';

/** @type {import("eslint").Linter.Config} */
export default [
  {
    ignores: ['*.config.*', '.storybook/**/*', 'dist/**/*'],
  },
  ...config,
];
