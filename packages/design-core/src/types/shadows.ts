import type { DesignTokenValue } from './token-value';

export interface BoxShadowValue extends DesignTokenValue<string> {
  type: 'boxShadow';
}

export interface ShadowToken {
  xs: BoxShadowValue;
  sm: BoxShadowValue;
  md: BoxShadowValue;
  lg: BoxShadowValue;
  xl: BoxShadowValue;
  inner: BoxShadowValue;
  focus: BoxShadowValue;
}

export interface Shadows {
  shadow: ShadowToken;
}
