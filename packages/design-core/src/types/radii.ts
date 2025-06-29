import type { DesignTokenValue } from './token-value';

export interface BorderRadiusValue extends DesignTokenValue<string> {
  type: 'borderRadius';
}

export interface RadiusToken {
  sm: BorderRadiusValue;
  md: BorderRadiusValue;
  lg: BorderRadiusValue;
  full: BorderRadiusValue;
}

export interface Radii {
  radius: RadiusToken;
}
