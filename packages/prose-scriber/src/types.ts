/**
 * Interface for brand colors.
 */
export interface BrandColors {
  primary: string;
  secondary: string;
  accent?: string;
}

/**
 * Interface for the overall theme configuration.
 */
export interface ThemeConfig {
  fontSize: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  color: {
    textDark: string;
    textLight: string;
    background: string;
    surface: string;
  };
  brandColors: BrandColors;
  typography?: {
    fontFamily?: string;
    fontWeights?: { [key: string]: number };
    lineHeights?: { [key: string]: number };
    letterSpacing?: { [key: string]: string };
  };
}

/**
 * Interface for animation options.
 */
export interface AnimationOptions {
  speed?: number;
  delay?: number;
  easing?: string;
}
