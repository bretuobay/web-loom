module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier', 'plugin:prettier/recommended'],
  plugins: ['@typescript-eslint', 'prettier'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  rules: {
    'prettier/prettier': 'warn',
    // Add any project-specific ESLint rules here
    '@typescript-eslint/no-explicit-any': 'off', // Allowing 'any' for now as per PRD's initial API sketch
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Might be useful later
    'no-console': 'off', // Allow console.log for example usage and debugging
  },
  settings: {
    // If you're using path aliases
    // 'import/resolver': {
    //   typescript: {}, // this loads <rootdir>/tsconfig.json to eslint
    // },
  },
};
