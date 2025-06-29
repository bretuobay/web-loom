import type { DesignTokenValue } from './token-value';

export interface FontFamilyValue extends DesignTokenValue<string> {
  type: 'fontFamily';
}

export interface FontSizeValue extends DesignTokenValue<string> {
  type: 'fontSize';
}

export interface FontWeightValue extends DesignTokenValue<string> {
  type: 'fontWeight';
}

export interface LineHeightValue extends DesignTokenValue<string> {
  type: 'lineHeight';
}

export interface LetterSpacingValue extends DesignTokenValue<string> {
  type: 'letterSpacing';
}

export interface TextCaseValue extends DesignTokenValue<string> {
  type: 'textCase';
}

export interface FontToken {
  family: {
    base: FontFamilyValue;
    heading: FontFamilyValue;
  };
  size: {
    xs: FontSizeValue;
    sm: FontSizeValue;
    md: FontSizeValue;
    lg: FontSizeValue;
    xl: FontSizeValue;
    '2xl': FontSizeValue;
    '3xl': FontSizeValue;
  };
  weight: {
    light: FontWeightValue;
    regular: FontWeightValue;
    medium: FontWeightValue;
    bold: FontWeightValue;
    extrabold: FontWeightValue;
  };
}

export interface LineHeightToken {
  tight: LineHeightValue;
  normal: LineHeightValue;
  loose: LineHeightValue;
}

export interface LetterSpacingToken {
  tight: LetterSpacingValue;
  normal: LetterSpacingValue;
  wide: LetterSpacingValue;
}

export interface TextCaseToken {
  uppercase: TextCaseValue;
  lowercase: TextCaseValue;
  capitalize: TextCaseValue;
}

export interface TypographyToken {
  font: FontToken;
  lineHeight: LineHeightToken;
  letterSpacing: LetterSpacingToken;
  textCase: TextCaseToken;
}

export interface Typography {
  typography: TypographyToken;
}
