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
 * Represents a category of color tokens.
 * Assumes color token values are strings.
 */
export interface ColorTokens {
  [key: string]: string | ColorTokens; // Allows for nested color groups
}

/**
 * Represents a category of spacing tokens.
 * Assumes spacing values are numbers or strings.
 */
export interface SpacingTokens {
  [key: string]: number | string | SpacingTokens; // Allows for nested spacing groups
}

/**
 * Represents an individual font style definition.
 */
export interface FontStyleToken {
  fontFamily?: string;
  fontSize?: string | number;
  fontWeight?: string | number;
  lineHeight?: string | number;
  letterSpacing?: string;
}

/**
 * Represents a category of typography tokens.
 * Values can be FontStyleToken objects or nested TypographyTokens groups.
 */
export interface TypographyTokens {
  [key: string]: FontStyleToken | TypographyTokens; // Allows for nested typography groups
}

/**
 * Example of a more specific DesignTokens interface, tailored to known categories.
 * This provides more precise type information for consumers.
 */
export interface SpecificDesignTokens extends DesignTokens {
  colors?: ColorTokens;
  spacing?: SpacingTokens;
  typography?: TypographyTokens;
  // Consumers can extend this with other known categories like
  // borderRadius?: TokenCategory;
  // shadows?: TokenCategory;
}
