import type { DesignTokenValue } from './token-value';

export interface BorderWidthValue extends DesignTokenValue<string> {
  type: 'borderWidth';
}

export interface BorderStyleValue extends DesignTokenValue<string> {
  type: 'borderStyle';
}

export interface BorderToken {
  width: {
    '1': BorderWidthValue;
    '2': BorderWidthValue;
    '4': BorderWidthValue;
  };
  style: {
    solid: BorderStyleValue;
    dashed: BorderStyleValue;
    dotted: BorderStyleValue;
    none: BorderStyleValue;
  };
}

export interface Borders {
  border: BorderToken;
}
