import type { DesignTokenValue } from './token-value';

export interface OpacityValue extends DesignTokenValue<string> { // Or number, if values are strictly numeric
  type: 'opacity';
}

export interface OpacityToken {
  '0': OpacityValue;
  '25': OpacityValue;
  '50': OpacityValue;
  '75': OpacityValue;
  '100': OpacityValue;
  disabled: OpacityValue;
  muted: OpacityValue;
}

export interface Opacities {
  opacity: OpacityToken;
}
