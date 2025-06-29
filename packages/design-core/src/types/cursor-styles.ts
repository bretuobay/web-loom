import type { DesignTokenValue } from './token-value';

export interface CursorValue extends DesignTokenValue<string> {
  type: 'cursor';
}

export interface CursorToken {
  auto: CursorValue;
  default: CursorValue;
  pointer: CursorValue;
  wait: CursorValue;
  text: CursorValue;
  move: CursorValue;
  'not-allowed': CursorValue;
  grab: CursorValue;
  grabbing: CursorValue;
}

export interface CursorStyles {
  cursor: CursorToken;
}
