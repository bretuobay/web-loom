// packages/design-core/src/utils/tokens.d.ts

/**
 * Represents a single token value, which can be a string (e.g., color hex)
 * or a number (e.g., spacing unit).
 */
export type TokenValue = string | number;

/**
 * Represents a group of related tokens, like all primary colors or all spacing sizes.
 * This can be a flat object of token values or a nested structure.
 */
export interface TokenGroup {
  [key: string]: TokenValue | TokenGroup;
}

/**
 * Represents a category of tokens, such as 'colors', 'spacing', 'typography'.
 */
export interface TokenCategory {
  [key: string]: TokenGroup | TokenValue;
}

/**
 * Represents the entire collection of design tokens.
 * The keys are category names (e.g., 'colors', 'spacing').
 */
export interface DesignTokens {
  [category: string]: TokenCategory;
}

/**
 * A more specific type for color tokens, assuming they are strings.
 */
export interface ColorTokenGroup {
  [key: string]: string | ColorTokenGroup;
}

export interface ColorTokens {
  [key: string]: string | ColorTokenGroup;
}

/**
 * A more specific type for spacing tokens, assuming they are numbers or strings.
 */
export interface SpacingTokenGroup {
  [key: string]: number | string | SpacingTokenGroup;
}
export interface SpacingTokens {
  [key: string]: number | string | SpacingTokenGroup;
}

/**
 * A more specific type for typography tokens.
 */
export interface FontStyleToken {
  fontFamily?: string;
  fontSize?: string | number;
  fontWeight?: string | number;
  lineHeight?: string | number;
  letterSpacing?: string;
}
export interface TypographyTokenGroup {
  [key: string]: FontStyleToken | TypographyTokenGroup;
}

export interface TypographyTokens {
  [key: string]: FontStyleToken | TypographyTokenGroup;
}

// Example of how specific tokens might look
export interface SpecificDesignTokens {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  // Add other categories like borderRadius, shadows, etc.
}
