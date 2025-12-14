/**
 * Default Theme Configurations
 *
 * Provides default light and dark theme configurations
 */

import type { ThemeConfig } from './types';

const checkboxComponentTokens = {
  size: '18px',
  gap: '0.45rem',
  borderRadius: '4px',
  indicatorSize: '10px',
  borderWidth: '1px',
  focusRing: 'rgba(22, 119, 255, 0.25)',
};

const radioComponentTokens = {
  size: '16px',
  gap: '0.35rem',
  borderWidth: '1px',
  indicatorSize: '8px',
  buttonVertical: '0.35rem',
  buttonHorizontal: '0.95rem',
  buttonBorderRadius: '6px',
};

/**
 * Default light theme configuration
 */
export const defaultLightTheme: ThemeConfig = {
  token: {
    // Primary colors
    colorPrimary: '#1677ff',
    colorPrimaryHover: '#4096ff',
    colorPrimaryActive: '#0958d9',
    colorPrimaryBorder: '#91caff',
    colorPrimaryBg: '#e6f4ff',
    colorPrimaryBgHover: '#bae0ff',

    // Success colors
    colorSuccess: '#52c41a',
    colorSuccessHover: '#73d13d',
    colorSuccessBorder: '#95de64',
    colorSuccessBg: '#f6ffed',

    // Warning colors
    colorWarning: '#faad14',
    colorWarningHover: '#ffc53d',
    colorWarningBorder: '#ffd666',
    colorWarningBg: '#fffbe6',

    // Error colors
    colorError: '#ff4d4f',
    colorErrorHover: '#ff7875',
    colorErrorBorder: '#ffa39e',
    colorErrorBg: '#fff2f0',

    // Info colors
    colorInfo: '#1677ff',
    colorInfoHover: '#4096ff',
    colorInfoBorder: '#91caff',
    colorInfoBg: '#e6f4ff',

    // Text colors
    colorText: 'rgba(0, 0, 0, 0.88)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
    colorTextDisabled: 'rgba(0, 0, 0, 0.25)',

    // Background colors
    colorBg: '#ffffff',
    colorBgSecondary: '#fafafa',
    colorBgTertiary: '#f5f5f5',
    colorBgElevated: '#ffffff',

    // Border colors
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',

    // Link colors
    colorLink: '#1677ff',
    colorLinkHover: '#4096ff',
    colorLinkActive: '#0958d9',

    // Spacing
    spaceXS: '4px',
    spaceSM: '8px',
    spaceMD: '16px',
    spaceLG: '24px',
    spaceXL: '32px',
    spaceXXL: '48px',

    // Typography
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontFamilyMono: "'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSizeXS: '12px',
    fontSizeSM: '14px',
    fontSizeBase: '16px',
    fontSizeLG: '18px',
    fontSizeXL: '20px',
    fontSize2XL: '24px',
    fontSize3XL: '30px',
    fontWeightLight: 300,
    fontWeightNormal: 400,
    fontWeightMedium: 500,
    fontWeightSemibold: 600,
    fontWeightBold: 700,
    lineHeightTight: 1.25,
    lineHeightNormal: 1.5,
    lineHeightRelaxed: 1.75,

    // Border radius
    radiusXS: '2px',
    radiusSM: '4px',
    radiusMD: '6px',
    radiusLG: '8px',
    radiusXL: '12px',
    radiusFull: '9999px',

    // Shadows
    shadowXS: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    shadowSM: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    shadowMD: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    shadowLG: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    shadowXL: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',

    // Z-index
    zIndexDropdown: 1000,
    zIndexSticky: 1020,
    zIndexFixed: 1030,
    zIndexModalBackdrop: 1040,
    zIndexModal: 1050,
    zIndexPopover: 1060,
    zIndexTooltip: 1070,

    // Transitions
    transitionFast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    transitionBase: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transitionSlow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    transitionSlower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  components: {
    Button: {
      height: '32px',
      paddingX: '16px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
    },
    Input: {
      height: '32px',
      paddingX: '12px',
      borderRadius: '6px',
      fontSize: '14px',
    },
    Card: {
      padding: '24px',
      borderRadius: '8px',
      shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    },
    Checkbox: {
      ...checkboxComponentTokens,
    },
    Radio: {
      ...radioComponentTokens,
    },
  },
};

/**
 * Default dark theme configuration
 */
export const defaultDarkTheme: ThemeConfig = {
  token: {
    // Primary colors
    colorPrimary: '#1677ff',
    colorPrimaryHover: '#4096ff',
    colorPrimaryActive: '#0958d9',
    colorPrimaryBorder: '#153d72',
    colorPrimaryBg: '#111a2c',
    colorPrimaryBgHover: '#112545',

    // Success colors
    colorSuccess: '#52c41a',
    colorSuccessHover: '#73d13d',
    colorSuccessBorder: '#274916',
    colorSuccessBg: '#162312',

    // Warning colors
    colorWarning: '#faad14',
    colorWarningHover: '#ffc53d',
    colorWarningBorder: '#594214',
    colorWarningBg: '#2b2111',

    // Error colors
    colorError: '#ff4d4f',
    colorErrorHover: '#ff7875',
    colorErrorBorder: '#58181c',
    colorErrorBg: '#2a1215',

    // Info colors
    colorInfo: '#1677ff',
    colorInfoHover: '#4096ff',
    colorInfoBorder: '#153d72',
    colorInfoBg: '#111a2c',

    // Text colors
    colorText: 'rgba(255, 255, 255, 0.85)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
    colorTextDisabled: 'rgba(255, 255, 255, 0.25)',

    // Background colors
    colorBg: '#141414',
    colorBgSecondary: '#1f1f1f',
    colorBgTertiary: '#2a2a2a',
    colorBgElevated: '#1f1f1f',

    // Border colors
    colorBorder: '#424242',
    colorBorderSecondary: '#303030',

    // Link colors
    colorLink: '#1677ff',
    colorLinkHover: '#4096ff',
    colorLinkActive: '#0958d9',

    // Spacing (same as light theme)
    spaceXS: '4px',
    spaceSM: '8px',
    spaceMD: '16px',
    spaceLG: '24px',
    spaceXL: '32px',
    spaceXXL: '48px',

    // Typography (same as light theme)
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontFamilyMono: "'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSizeXS: '12px',
    fontSizeSM: '14px',
    fontSizeBase: '16px',
    fontSizeLG: '18px',
    fontSizeXL: '20px',
    fontSize2XL: '24px',
    fontSize3XL: '30px',
    fontWeightLight: 300,
    fontWeightNormal: 400,
    fontWeightMedium: 500,
    fontWeightSemibold: 600,
    fontWeightBold: 700,
    lineHeightTight: 1.25,
    lineHeightNormal: 1.5,
    lineHeightRelaxed: 1.75,

    // Border radius (same as light theme)
    radiusXS: '2px',
    radiusSM: '4px',
    radiusMD: '6px',
    radiusLG: '8px',
    radiusXL: '12px',
    radiusFull: '9999px',

    // Shadows (adjusted for dark mode)
    shadowXS: '0 1px 2px 0 rgba(0, 0, 0, 0.48)',
    shadowSM: '0 1px 3px 0 rgba(0, 0, 0, 0.48), 0 1px 2px -1px rgba(0, 0, 0, 0.48)',
    shadowMD: '0 4px 6px -1px rgba(0, 0, 0, 0.48), 0 2px 4px -2px rgba(0, 0, 0, 0.48)',
    shadowLG: '0 10px 15px -3px rgba(0, 0, 0, 0.48), 0 4px 6px -4px rgba(0, 0, 0, 0.48)',
    shadowXL: '0 20px 25px -5px rgba(0, 0, 0, 0.48), 0 8px 10px -6px rgba(0, 0, 0, 0.48)',

    // Z-index (same as light theme)
    zIndexDropdown: 1000,
    zIndexSticky: 1020,
    zIndexFixed: 1030,
    zIndexModalBackdrop: 1040,
    zIndexModal: 1050,
    zIndexPopover: 1060,
    zIndexTooltip: 1070,

    // Transitions (same as light theme)
    transitionFast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    transitionBase: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transitionSlow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    transitionSlower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  components: {
    Button: {
      height: '32px',
      paddingX: '16px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
    },
    Input: {
      height: '32px',
      paddingX: '12px',
      borderRadius: '6px',
      fontSize: '14px',
    },
    Card: {
      padding: '24px',
      borderRadius: '8px',
      shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.48), 0 1px 2px -1px rgba(0, 0, 0, 0.48)',
    },
    Checkbox: {
      ...checkboxComponentTokens,
    },
    Radio: {
      ...radioComponentTokens,
    },
  },
};

/**
 * Merge theme configurations
 */
export function mergeTheme(base: ThemeConfig, override?: Partial<ThemeConfig>): ThemeConfig {
  if (!override) return base;

  return {
    token: {
      ...base.token,
      ...override.token,
    },
    components: {
      ...base.components,
      ...override.components,
    },
  };
}

/**
 * Get theme by mode
 */
export function getThemeByMode(mode: 'light' | 'dark' | 'auto'): ThemeConfig {
  if (mode === 'auto') {
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? defaultDarkTheme : defaultLightTheme;
    }
    return defaultLightTheme;
  }

  return mode === 'dark' ? defaultDarkTheme : defaultLightTheme;
}
