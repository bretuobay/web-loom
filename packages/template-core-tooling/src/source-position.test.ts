import { describe, expect, it } from 'vitest';
import { lineColumnToOffset, offsetToLineColumn } from './source-position.js';

describe('source-position', () => {
  it('converts line/column to offset and back', () => {
    const source = 'abc\ndef\nghi';
    const offset = lineColumnToOffset(source, 2, 2);
    expect(offset).toBe(5);
    expect(offsetToLineColumn(source, offset)).toEqual({ line: 2, column: 2 });
  });
});
