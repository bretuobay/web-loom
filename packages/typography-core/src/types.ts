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
// types.ts - Animation options interface
export interface AnimationOptions {
  duration?: number;
  delay?: number;
  easing?: string;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  playState?: 'running' | 'paused';

  // Text-specific options
  speed?: number;
  pauseOnHover?: boolean;
  onComplete?: () => void;
  onStart?: () => void;

  // Typewriter specific
  cursor?: boolean;
  cursorChar?: string;
  cursorBlink?: boolean;

  // Fade/slide specific
  from?: 'top' | 'bottom' | 'left' | 'right';
  distance?: string;

  // Character animation specific
  stagger?: number;
  randomDelay?: boolean;
}

export interface AnimationController {
  play(): void;
  pause(): void;
  reverse(): void;
  cancel(): void;
  finish(): void;
  readonly finished: Promise<Animation>;
}
