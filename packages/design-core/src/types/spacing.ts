import type { DesignTokenValue } from './token-value';

export interface SpacingValue extends DesignTokenValue<string> {
  type: 'spacing';
}

export interface SpacingSizeValue {
  sm: SpacingValue;
  md: SpacingValue;
  lg: SpacingValue;
}

export interface SpacingToken {
  '0': SpacingValue;
  '1': SpacingValue;
  '2': SpacingValue;
  '3': SpacingValue;
  '4': SpacingValue;
  '5': SpacingValue;
  '6': SpacingValue;
  '7': SpacingValue;
  '8': SpacingValue;
  '9': SpacingValue;
  '10': SpacingValue;
  gutter: SpacingValue;
  padding: SpacingSizeValue;
  margin: SpacingSizeValue;
}

export interface Spacing {
  spacing: SpacingToken;
}
