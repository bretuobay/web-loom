import type { DesignTokenValue } from './token-value';

export interface BreakpointValue extends DesignTokenValue<string> {
  type: 'breakpoint';
}

export interface MediaQueryValue extends DesignTokenValue<string> {
  type: 'mediaQuery';
}

export interface BreakpointToken {
  xs: BreakpointValue;
  sm: BreakpointValue;
  md: BreakpointValue;
  lg: BreakpointValue;
  xl: BreakpointValue;
  '2xl': BreakpointValue;
  orientation: {
    portrait: MediaQueryValue;
    landscape: MediaQueryValue;
  };
}

export interface Breakpoints {
  breakpoint: BreakpointToken;
}
