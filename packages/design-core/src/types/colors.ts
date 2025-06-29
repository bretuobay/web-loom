import type { DesignTokenValue } from './token-value';

export interface ColorValue extends DesignTokenValue<string> {
  type: 'color';
}

export interface ColorBaseToken {
  primary: ColorValue;
  secondary: ColorValue;
  success: ColorValue;
  warning: ColorValue;
  danger: ColorValue;
}

export interface ColorNeutralToken {
  black: ColorValue;
  white: ColorValue;
  gray: {
    '50': ColorValue;
    '100': ColorValue;
    '200': ColorValue;
    '300': ColorValue;
    '400': ColorValue;
    '500': ColorValue;
    '600': ColorValue;
    '700': ColorValue;
    '800': ColorValue;
    '900': ColorValue;
  };
}

export interface ColorThemedTokenSet {
  background: ColorValue;
  text: ColorValue;
}

export interface ColorThemedToken {
  light: ColorThemedTokenSet;
  dark: ColorThemedTokenSet;
  'high-contrast': ColorThemedTokenSet;
}

export interface ColorAlphaToken {
  'primary-50': ColorValue;
  'primary-100': ColorValue;
  'black-50': ColorValue;
}

export interface ColorToken {
  base: ColorBaseToken;
  neutral: ColorNeutralToken;
  themed: ColorThemedToken;
  alpha: ColorAlphaToken;
}

export interface Colors {
  color: ColorToken;
}
