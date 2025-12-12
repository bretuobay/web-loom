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
    baseConfig.resolve.alias = {
      ...(baseConfig.resolve.alias ?? {}),
      '@repo/ui-react': resolve(__dirname, '../src'),
      '@web-loom/design-core': resolve(__dirname, '../design-core/src/index.ts'),
      '@web-loom/design-core/design-system': resolve(__dirname, '../design-core/src/design-system'),
      '@web-loom/ui-core': resolve(__dirname, '../ui-core/src/index.ts'),
      '@web-loom/ui-core/behaviors': resolve(__dirname, '../ui-core/src/behaviors/index.ts'),
      '@web-loom/ui-core/behaviors/*': `${resolve(__dirname, '../ui-core/src/behaviors')}/*`,
      '@web-loom/ui-patterns': resolve(__dirname, '../ui-patterns/src/index.ts'),
      '@web-loom/store-core': resolve(__dirname, '../store-core/src/index.ts'),
      '@web-loom/forms-core': resolve(__dirname, '../forms-core/src/index.ts'),
      '@web-loom/forms-react': resolve(__dirname, '../forms-react/src/index.ts'),
      '@web-loom/event-bus-core': resolve(__dirname, '../event-bus-core/src/index.ts'),
    };
    return baseConfig;
  },
};

export default config;
