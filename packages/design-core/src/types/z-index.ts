import type { DesignTokenValue } from './token-value';

export interface ZIndexValue extends DesignTokenValue<string | number> {
  // Value can be 'auto' or a number
  type: 'zIndex';
}

export interface ZIndexToken {
  auto: ZIndexValue;
  '0': ZIndexValue;
  '10': ZIndexValue;
  '20': ZIndexValue;
  '30': ZIndexValue;
  '40': ZIndexValue;
  '50': ZIndexValue;
  max: ZIndexValue;
}

export interface ZIndex {
  zIndex: ZIndexToken;
}
