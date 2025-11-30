import type { ThemeConfig } from './types';
import { lighten, darken } from './color';
import { animateText } from './animations';

export * from './utils/color-similarity';
export * from './calculations';
export * from './core';
export * from './fonts';

/**
 * Initializes the library and returns a theme object with utility functions.
 * @param config The theme configuration object.
 * @returns An object containing the theme and API functions.
 */
export function createTheme(initialConfig: ThemeConfig) {
  let currentConfig = initialConfig;

  return {
    getColor(key: keyof ThemeConfig['color']): string {
      return currentConfig.color[key];
    },
    getBrandColor(key: keyof ThemeConfig['brandColors']): string {
      return currentConfig.brandColors[key] || '#000000';
    },
    getFontSize(key: keyof ThemeConfig['fontSize']): string {
      return currentConfig.fontSize[key];
    },
    getTheme(): ThemeConfig {
      return currentConfig;
    },
    setTheme(newConfig: ThemeConfig) {
      currentConfig = newConfig;
    },
    lighten,
    darken,
    animateText,
  };
}
