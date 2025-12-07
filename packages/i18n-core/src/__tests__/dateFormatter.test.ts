import { describe, it, expect } from 'vitest';
import { DateFormatter } from '../formatters/date';

describe('DateFormatter', () => {
  const df = new DateFormatter();
  const locale = 'en-US';
  const date = new Date('2020-01-02T03:04:05Z');

  it('formats date', () => {
    expect(df.format(date, locale)).toMatch(/2020/);
  });

  it('formats date with formatDate', () => {
    expect(df.formatDate(date, locale)).toMatch(/2020/);
  });

  it('formats time with formatTime', () => {
    expect(df.formatTime(date, locale)).toMatch(/\d{1,2}:\d{2}/);
  });

  it('formats relative time (future)', () => {
    const future = Date.now() + 3600 * 1000;
    expect(df.formatRelative(future, locale)).toMatch(/in|hour|minute|second/);
  });

  it('formats relative time (past)', () => {
    const past = Date.now() - 3600 * 1000;
    expect(df.formatRelative(past, locale)).toMatch(/ago|hour|minute|second/);
  });
});
