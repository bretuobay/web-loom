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
    };
    return baseConfig;
  },
};

export default config;

