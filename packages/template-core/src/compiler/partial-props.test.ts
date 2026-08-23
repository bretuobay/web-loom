import { describe, expect, it } from 'vitest';
import { analyzeCompiledTemplate, compile } from '../index.js';

describe('analyzeCompiledTemplate', () => {
  it('compares hash args to Template.props after children are attached', () => {
    const card = compile('<a href="{{ href }}">{{ count }}</a>', { props: ['count', 'href'] });
    const page = compile('{{> card count=n}}');
    page.partials = { card };

    expect(analyzeCompiledTemplate(page)).toEqual([
      expect.objectContaining({
        code: 'MISSING_PARTIAL_PROP',
        details: expect.objectContaining({ partial: 'card', prop: 'href' }),
      }),
    ]);
  });

  it('accepts a complete hash-arg call site', () => {
    const card = compile('<a href="{{ href }}">{{ count }}</a>', { props: ['count', 'href'] });
    const page = compile('{{> card count=n href=path}}', { partials: { card } });
    expect(analyzeCompiledTemplate(page)).toEqual([]);
  });
});

describe('analyzeTemplate with Template.props', () => {
  it('prefers live Template.props over a partialProps stub', async () => {
    const { analyzeTemplate } = await import('./node.js');
    const card = compile('<a href="{{ href }}">{{ count }}</a>', { props: ['count', 'href'] });
    const result = analyzeTemplate('{{> card count=n extra=x}}', {
      partials: { card },
      partialProps: { card: ['count', 'extra'] },
    });
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ code: 'UNKNOWN_PARTIAL_PROP', details: expect.objectContaining({ prop: 'extra' }) }),
      expect.objectContaining({ code: 'MISSING_PARTIAL_PROP', details: expect.objectContaining({ prop: 'href' }) }),
    ]);
  });
});
