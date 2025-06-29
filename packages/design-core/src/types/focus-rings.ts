import type { DesignTokenValue } from './token-value';
import type { ColorValue } from './colors';
import type { BorderWidthValue } from './borders';
import type { SpacingValue } from './spacing'; // Import SpacingValue

export interface FocusRingStyleValue extends DesignTokenValue<string> {
  type: 'focusRing';
}

export interface FocusRingToken {
  color: {
    default: ColorValue;
    error: ColorValue;
  };
  offset: {
    none: SpacingValue;
    sm: SpacingValue;
    md: SpacingValue;
  };
  width: {
    sm: BorderWidthValue;
    md: BorderWidthValue;
    lg: BorderWidthValue;
  };
  default: FocusRingStyleValue;
  error: FocusRingStyleValue;
}

export interface FocusRings {
  focusRing: FocusRingToken;
}
