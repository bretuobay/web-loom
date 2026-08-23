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
          header: 'src/templates/header.loom',
          footer: 'src/templates/footer.loom',
          'greenhouse-card': 'src/templates/greenhouse-card.loom',
          'sensor-card': 'src/templates/sensor-card.loom',
          'sensor-reading-card': 'src/templates/sensor-reading-card.loom',
          'threshold-alert-card': 'src/templates/threshold-alert-card.loom',
        },
        // App-context keys plus per-screen setup extras used in .loom files.
        contextKeys: [
          'greenHouses',
          'sensors',
          'sensorReadings',
          'thresholdAlerts',
          'links',
          'dashboardLoading$',
          'greenhouseForm',
          'editGreenhouse',
          'deleteGreenhouse',
          'sizeOptions',
          'formatTimestamp',
        ],
      },
    },
  },
];
