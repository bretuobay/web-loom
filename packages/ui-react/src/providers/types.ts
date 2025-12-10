/**
 * Theme System Types
 *
 * Defines the type system for the theme configuration and context
 */

import type { ReactNode } from 'react';

/**
 * Color palette tokens
 */
export interface ColorTokens {
  /** Primary brand color */
  colorPrimary: string;
  /** Primary color hover state */
  colorPrimaryHover: string;
  /** Primary color active/pressed state */
  colorPrimaryActive: string;
  /** Primary color border */
  colorPrimaryBorder: string;
  /** Primary color background (subtle) */
  colorPrimaryBg: string;
  /** Primary color background hover */
  colorPrimaryBgHover: string;

  /** Success state color */
  colorSuccess: string;
  /** Success color hover state */
  colorSuccessHover: string;
  /** Success color border */
  colorSuccessBorder: string;
  /** Success color background */
  colorSuccessBg: string;

  /** Warning state color */
  colorWarning: string;
  /** Warning color hover state */
  colorWarningHover: string;
  /** Warning color border */
  colorWarningBorder: string;
  /** Warning color background */
  colorWarningBg: string;

  /** Error/danger state color */
  colorError: string;
  /** Error color hover state */
  colorErrorHover: string;
  /** Error color border */
  colorErrorBorder: string;
  /** Error color background */
  colorErrorBg: string;

  /** Info state color */
  colorInfo: string;
  /** Info color hover state */
  colorInfoHover: string;
  /** Info color border */
  colorInfoBorder: string;
  /** Info color background */
  colorInfoBg: string;

  /** Text colors */
  colorText: string;
  colorTextSecondary: string;
  colorTextTertiary: string;
  colorTextDisabled: string;

  /** Background colors */
  colorBg: string;
  colorBgSecondary: string;
  colorBgTertiary: string;
  colorBgElevated: string;

  /** Border colors */
  colorBorder: string;
  colorBorderSecondary: string;

  /** Link colors */
  colorLink: string;
  colorLinkHover: string;
  colorLinkActive: string;
}

/**
 * Spacing tokens
 */
export interface SpacingTokens {
  /** Extra small spacing (4px) */
  spaceXS: string;
  /** Small spacing (8px) */
  spaceSM: string;
  /** Medium spacing (16px) */
  spaceMD: string;
  /** Large spacing (24px) */
  spaceLG: string;
  /** Extra large spacing (32px) */
  spaceXL: string;
  /** 2x extra large spacing (48px) */
  spaceXXL: string;
}

/**
 * Typography tokens
 */
export interface TypographyTokens {
  /** Font family */
  fontFamily: string;
  /** Monospace font family */
  fontFamilyMono: string;

  /** Font sizes */
  fontSizeXS: string;
  fontSizeSM: string;
  fontSizeBase: string;
  fontSizeLG: string;
  fontSizeXL: string;
  fontSize2XL: string;
  fontSize3XL: string;

  /** Font weights */
  fontWeightLight: number;
  fontWeightNormal: number;
  fontWeightMedium: number;
  fontWeightSemibold: number;
  fontWeightBold: number;

  /** Line heights */
  lineHeightTight: number;
  lineHeightNormal: number;
  lineHeightRelaxed: number;
}

/**
 * Border radius tokens
 */
export interface RadiusTokens {
  radiusXS: string;
  radiusSM: string;
  radiusMD: string;
  radiusLG: string;
  radiusXL: string;
  radiusFull: string;
}

/**
 * Shadow tokens
 */
export interface ShadowTokens {
  shadowXS: string;
  shadowSM: string;
  shadowMD: string;
  shadowLG: string;
  shadowXL: string;
}

/**
 * Z-index tokens
 */
export interface ZIndexTokens {
  zIndexDropdown: number;
  zIndexSticky: number;
  zIndexFixed: number;
  zIndexModalBackdrop: number;
  zIndexModal: number;
  zIndexPopover: number;
  zIndexTooltip: number;
}

/**
 * Transition tokens
 */
export interface TransitionTokens {
  transitionFast: string;
  transitionBase: string;
  transitionSlow: string;
  transitionSlower: string;
}

/**
 * Complete design token set
 */
export interface DesignTokens
  extends ColorTokens,
    SpacingTokens,
    TypographyTokens,
    RadiusTokens,
    ShadowTokens,
    ZIndexTokens,
    TransitionTokens {}

/**
 * Component-specific configuration overrides
 */
export interface ComponentTokens {
  Button?: {
    /** Button height */
    height?: string;
    /** Button padding horizontal */
    paddingX?: string;
    /** Button border radius */
    borderRadius?: string;
    /** Button font size */
    fontSize?: string;
    /** Button font weight */
    fontWeight?: number;
  };
  Input?: {
    /** Input height */
    height?: string;
    /** Input padding horizontal */
    paddingX?: string;
    /** Input border radius */
    borderRadius?: string;
    /** Input font size */
    fontSize?: string;
  };
  Card?: {
    /** Card padding */
    padding?: string;
    /** Card border radius */
    borderRadius?: string;
    /** Card shadow */
    shadow?: string;
  };
  // Add more component overrides as needed
  [key: string]: Record<string, string | number> | undefined;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Design tokens */
  token: Partial<DesignTokens>;
  /** Component-specific overrides */
  components?: ComponentTokens;
}

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Theme context value
 */
export interface ThemeContextValue {
  /** Current theme configuration */
  theme: ThemeConfig;
  /** Current theme mode */
  mode: ThemeMode;
  /** Update theme configuration */
  setTheme: (theme: Partial<ThemeConfig>) => void;
  /** Update theme mode */
  setMode: (mode: ThemeMode) => void;
  /** CSS variable prefix */
  cssVarPrefix: string;
}

/**
 * ThemeProvider props
 */
export interface ThemeProviderProps {
  /** Child components */
  children: ReactNode;
  /** Initial theme configuration */
  theme?: ThemeConfig;
  /** Initial theme mode */
  mode?: ThemeMode;
  /** CSS variable prefix (default: 'ui') */
  cssVarPrefix?: string;
  /** Container element to inject CSS variables (default: document.documentElement) */
  container?: HTMLElement;
}

/**
 * ConfigProvider props
 */
export interface ConfigProviderProps {
  /** Child components */
  children: ReactNode;
  /** Theme configuration */
  theme?: ThemeConfig;
  /** Theme mode */
  mode?: ThemeMode;
  /** CSS variable prefix */
  cssVarPrefix?: string;
  /** Additional configuration options */
  locale?: string;
  /** Direction (ltr/rtl) */
  direction?: 'ltr' | 'rtl';
}
