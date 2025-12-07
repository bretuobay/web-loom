import { describe, it, expect } from 'vitest';
import { ListFormatter } from '../formatters/list';

describe('ListFormatter', () => {
  const lf = new ListFormatter();
  const locale = 'en-US';

  it('formats lists', () => {
    expect(lf.format(['a', 'b', 'c'], locale)).toBe('a, b, and c');
    expect(lf.format(['a', 'b'], locale)).toBe('a and b');
    expect(lf.format(['a'], locale)).toBe('a');
  });
});
