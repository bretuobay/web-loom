import type { DesignTokenValue } from './token-value';

export interface DurationValue extends DesignTokenValue<string> {
  type: 'duration';
}

export interface DelayTiming {
  none: DurationValue;
  short: DurationValue;
  medium: DurationValue;
  long: DurationValue;
}

export interface DurationTiming {
  short: DurationValue;
  medium: DurationValue;
  long: DurationValue;
}

export interface TimingToken {
  delay: DelayTiming;
  duration: DurationTiming;
}

export interface Timing {
  timing: TimingToken;
}
