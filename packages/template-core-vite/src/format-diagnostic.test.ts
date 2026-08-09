import { describe, expect, it, vi } from 'vitest';
import { formatDiagnostic, reportDiagnostics } from './format-diagnostic.js';

describe('formatDiagnostic', () => {
  it('includes file coordinates and diagnostic code', () => {
    expect(
      formatDiagnostic('/app/header.ts', {
        code: 'INVALID_EXPRESSION',
        severity: 'error',
        message: 'Unexpected content in expression',
        filePath: '/app/header.ts',
        templateName: 'Header',
        line: 3,
        column: 12,
      }),
    ).toBe('[template-core] /app/header.ts:3:12 (Header): Unexpected content in expression [INVALID_EXPRESSION]');
  });
});

describe('reportDiagnostics', () => {
  it('routes warnings and errors to the reporter', () => {
    const warn = vi.fn();
    const error = vi.fn(() => {
      throw new Error('fail');
    });

    reportDiagnostics({ warn, error }, '/app/a.ts', [
      {
        code: 'RAW_HTML_UNSANITIZED',
        severity: 'warning',
        message: 'raw html',
        filePath: '/app/a.ts',
        line: 1,
        column: 1,
      },
    ]);
    expect(warn).toHaveBeenCalledOnce();

    expect(() =>
      reportDiagnostics({ warn, error }, '/app/a.ts', [
        {
          code: 'INVALID_EXPRESSION',
          severity: 'error',
          message: 'bad expr',
          filePath: '/app/a.ts',
          line: 1,
          column: 1,
        },
      ]),
    ).toThrow('fail');
  });
});
