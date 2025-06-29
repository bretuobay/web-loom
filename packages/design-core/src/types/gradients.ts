import type { DesignTokenValue } from './token-value';

export interface GradientValue extends DesignTokenValue<string> {
  type: 'gradient';
}

export interface GradientToken {
  'primary-to-secondary': GradientValue;
  'success-to-primary': GradientValue;
  'multicolor-diagonal': GradientValue;
  'radial-primary': GradientValue;
}

export interface Gradients {
  gradient: GradientToken;
}
