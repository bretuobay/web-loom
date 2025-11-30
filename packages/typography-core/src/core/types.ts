import type { TypographyToken } from '@web-loom/design-core';
import type { ScaleResult, VerticalRhythmMap } from '../calculations';

export interface TypographyBridgeConfig {
  families: Record<string, string>;
  fontSizes: Record<string, number>;
  fontWeights: Record<string, number>;
  lineHeights: Record<string, number>;
  letterSpacing: Record<string, string>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TypographyPresets {
  modularScale: ScaleResult;
  rhythm: VerticalRhythmMap;
  fluid: Record<string, string>;
}

export interface TypographyThemeSnapshot {
  name: string;
  config: TypographyBridgeConfig;
  presets: TypographyPresets;
  validation: ValidationResult;
}

export interface DesignTokensLike {
  typography?: TypographyToken;
  [key: string]: unknown;
}

export type TypographyTokenInput = TypographyToken | DesignTokensLike | undefined;

export interface DesignCoreTheme {
  name: string;
  tokens: Partial<DesignTokensLike>;
}
