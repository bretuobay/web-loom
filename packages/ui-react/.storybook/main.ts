import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (baseConfig) => {
    baseConfig.resolve = baseConfig.resolve ?? {};

    // Convert existing alias to array format if it exists
    const existingAlias = Array.isArray(baseConfig.resolve.alias)
      ? baseConfig.resolve.alias
      : [];

    // More specific patterns must come first
    baseConfig.resolve.alias = [
      ...existingAlias,
      { find: '@web-loom/design-core/design-system', replacement: resolve(__dirname, '../../design-core/src/design-system') },
      { find: '@web-loom/ui-core/behaviors', replacement: resolve(__dirname, '../../ui-core/src/behaviors/index.ts') },
      { find: /^@web-loom\/ui-core\/behaviors\/(.*)$/, replacement: resolve(__dirname, '../../ui-core/src/behaviors/$1.ts') },
      { find: '@web-loom/design-core', replacement: resolve(__dirname, '../../design-core/src/index.ts') },
      { find: '@web-loom/ui-core', replacement: resolve(__dirname, '../../ui-core/src/index.ts') },
      { find: '@web-loom/ui-patterns', replacement: resolve(__dirname, '../../ui-patterns/src/index.ts') },
      { find: '@web-loom/store-core', replacement: resolve(__dirname, '../../store-core/src/index.ts') },
      { find: '@web-loom/forms-core', replacement: resolve(__dirname, '../../forms-core/src/index.ts') },
      { find: '@web-loom/forms-react', replacement: resolve(__dirname, '../../forms-react/src/index.ts') },
      { find: '@web-loom/event-bus-core', replacement: resolve(__dirname, '../../event-bus-core/src/index.ts') },
      { find: '@repo/ui-react', replacement: resolve(__dirname, '../src') },
    ];
    return baseConfig;
  },
};

export default config;
