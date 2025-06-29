import type { DesignTokenValue } from './token-value';
import type { DurationValue } from './timing'; // Assuming DurationValue is defined in timing.ts
import type { MediaQueryValue } from './breakpoints'; // Assuming MediaQueryValue is in breakpoints.ts

export interface TimingFunctionValue extends DesignTokenValue<string> {
  type: 'timingFunction';
}

export interface TransitionPropertyValue extends DesignTokenValue<string> {
  property: string;
  duration: string; // references another token
  timingFunction: string; // references another token
  type: 'transition';
}

export interface TransitionDuration {
  fast: DurationValue;
  medium: DurationValue;
  slow: DurationValue;
}

export interface TransitionTimingFunction {
  linear: TimingFunctionValue;
  'ease-in': TimingFunctionValue;
  'ease-out': TimingFunctionValue;
  'ease-in-out': TimingFunctionValue;
}

export interface TransitionDelay {
  none: DurationValue;
  short: DurationValue;
  long: DurationValue;
}

export interface TransitionMotion {
  prefersReducedMotion: MediaQueryValue;
  default: TransitionPropertyValue;
}

export interface TransitionToken {
  duration: TransitionDuration;
  timingFunction: TransitionTimingFunction;
  delay: TransitionDelay;
  motion: TransitionMotion;
}

export interface Transitions {
  transition: TransitionToken;
}
