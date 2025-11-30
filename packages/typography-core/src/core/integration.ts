import type { TypographyToken } from '@web-loom/design-core';
import { createFluidType, generateModularScale, generateVerticalRhythm } from '../calculations';
import type {
  DesignCoreTheme,
  DesignTokensLike,
  TypographyBridgeConfig,
  TypographyPresets,
  TypographyThemeSnapshot,
  TypographyTokenInput,
  ValidationResult,
} from './types';

const DEFAULT_FONT_SIZE = 16;
const DEFAULT_RATIO = 1.25;

const toNumber = (value: string | number | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  const numeric = parseFloat(value);
  if (Number.isNaN(numeric)) {
    return undefined;
  }

  if (value.trim().endsWith('rem')) {
    return numeric * 16;
  }

  return numeric;
};

const fromToken = <T>(token: { value: T } | T | undefined): T | undefined => {
  if (token === undefined || token === null) {
    return undefined;
  }

  if (typeof token === 'object' && 'value' in token) {
    return token.value as T;
  }

  return token as T;
};

const isTypographyToken = (input: unknown): input is TypographyToken => {
  return !!input && typeof input === 'object' && 'font' in (input as Record<string, unknown>);
};

const resolveTypography = (input: TypographyTokenInput): TypographyToken | undefined => {
  if (!input) {
    return undefined;
  }

  if (isTypographyToken(input)) {
    return input;
  }

  if (typeof input === 'object' && input !== null && 'typography' in input) {
    const candidate = (input as DesignTokensLike).typography;
    if (candidate && isTypographyToken(candidate)) {
      return candidate;
    }
  }

  return undefined;
};

const ensureAscending = (min: number, max: number): [number, number] => {
  if (max <= min) {
    return [min, min + 2];
  }
  return [min, max];
};

export function consumeDesignTokens(input: TypographyTokenInput): TypographyBridgeConfig {
  const typography = resolveTypography(input);

  const config: TypographyBridgeConfig = {
    families: {
      base: 'system-ui',
      heading: 'system-ui',
    },
    fontSizes: {},
    fontWeights: {},
    lineHeights: {},
    letterSpacing: {},
  };

  if (!typography) {
    return config;
  }

  const familyBase = fromToken(typography.font?.family?.base);
  const familyHeading = fromToken(typography.font?.family?.heading);
  if (familyBase) {
    config.families.base = familyBase;
  }
  if (familyHeading) {
    config.families.heading = familyHeading;
  }

  const sizeTokens = typography.font?.size ?? {};
  for (const [key, token] of Object.entries(sizeTokens)) {
    const value = toNumber(fromToken(token));
    if (typeof value === 'number' && !Number.isNaN(value)) {
      config.fontSizes[key] = value;
    }
  }

  const weightTokens = typography.font?.weight ?? {};
  for (const [key, token] of Object.entries(weightTokens)) {
    const value = toNumber(fromToken(token));
    if (typeof value === 'number' && !Number.isNaN(value)) {
      config.fontWeights[key] = value;
    }
  }

  const lineHeightTokens = typography.lineHeight ?? {};
  for (const [key, token] of Object.entries(lineHeightTokens)) {
    const value = toNumber(fromToken(token));
    if (typeof value === 'number' && !Number.isNaN(value)) {
      config.lineHeights[key] = value;
    }
  }

  const letterSpacingTokens = typography.letterSpacing ?? {};
  for (const [key, token] of Object.entries(letterSpacingTokens)) {
    const value = fromToken(token);
    if (value) {
      config.letterSpacing[key] = value;
    }
  }

  return config;
}

export function validateTypographyTokens(input: TypographyTokenInput): ValidationResult {
  const typography = resolveTypography(input);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!typography) {
    errors.push('No typography tokens provided.');
  } else {
    if (!fromToken(typography.font?.family?.base)) {
      errors.push('Missing base font family token.');
    }
    if (!fromToken(typography.font?.size?.md)) {
      errors.push('Missing medium font size token (font.size.md).');
    }
    if (!fromToken(typography.lineHeight?.normal)) {
      warnings.push('Missing normal line-height token (lineHeight.normal).');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function generatePresetsFromTokens(input: TypographyTokenInput): TypographyPresets {
  const config = consumeDesignTokens(input);
  const baseSize = config.fontSizes.md ?? config.fontSizes.base ?? DEFAULT_FONT_SIZE;
  const ratioCandidate = config.fontSizes.lg && config.fontSizes.md ? config.fontSizes.lg / config.fontSizes.md : DEFAULT_RATIO;
  const ratio = ratioCandidate > 1 ? ratioCandidate : DEFAULT_RATIO;

  const modularScale = generateModularScale(baseSize, parseFloat(ratio.toFixed(3)), 4);
  const rhythm = generateVerticalRhythm((config.lineHeights.normal ?? 1.5) * baseSize, [0.5, 1, 1.5, 2]);

  const [bodyMin, bodyMax] = ensureAscending(config.fontSizes.sm ?? baseSize * 0.9, config.fontSizes.lg ?? baseSize * 1.25);
  const [headingMin, headingMax] = ensureAscending(config.fontSizes.lg ?? baseSize * 1.25, config.fontSizes['3xl'] ?? baseSize * 2);

  return {
    modularScale,
    rhythm,
    fluid: {
      body: createFluidType(bodyMin, bodyMax, 320, 1440),
      heading: createFluidType(headingMin, headingMax, 320, 1440),
    },
  };
}

export function createThemeFromDesignCore(theme: DesignCoreTheme): TypographyThemeSnapshot {
  const hasTypography = typeof theme.tokens === 'object' && theme.tokens !== null && 'typography' in theme.tokens;
  const tokens: DesignTokensLike = hasTypography ? (theme.tokens as DesignTokensLike) : { typography: undefined };

  const config = consumeDesignTokens(tokens);
  const presets = generatePresetsFromTokens(tokens);
  const validation = validateTypographyTokens(tokens);

  return {
    name: theme.name,
    config,
    presets,
    validation,
  };
}
