import type { DesignTokenValue } from './token-value';

export interface SizingValue extends DesignTokenValue<string> {
  type: 'sizing';
}

export interface SizeDimension {
  xs: SizingValue;
  sm: SizingValue;
  md: SizingValue;
  lg: SizingValue;
  xl: SizingValue;
  full?: SizingValue; // Optional for maxWidth, minHeight
  screen?: SizingValue; // Optional for width, height
}

export interface IconSize {
  sm: SizingValue;
  md: SizingValue;
  lg: SizingValue;
}

export interface SizingToken {
  width: SizeDimension;
  height: SizeDimension;
  maxWidth: SizeDimension;
  minHeight: SizeDimension;
  icon: IconSize;
}

export interface Sizing {
  sizing: SizingToken;
}
