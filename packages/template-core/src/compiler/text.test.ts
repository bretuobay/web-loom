import { describe, expect, it } from 'vitest';
import { tokenizeText } from './text.js';
import { TemplateSyntaxError } from '../errors.js';

describe('tokenizeText: static', () => {
  it('returns static for plain text with no mustaches', () => {
    expect(tokenizeText('hello world')).toEqual({ kind: 'static', value: 'hello world' });
  });
});

describe('tokenizeText: double mustache', () => {
  it('tokenizes a single interpolation', () => {
    const result = tokenizeText('{{ title$ }}');
    expect(result).toEqual({ kind: 'text', parts: [{ expr: { kind: 'path', segments: ['title$'], parentHops: 0 } }] });
  });

  it('tokenizes mixed static and expression parts', () => {
    const result = tokenizeText('Hello {{ name }}!');
    expect(result).toEqual({
      kind: 'text',
      parts: [
        { static: 'Hello ' },
        { expr: { kind: 'path', segments: ['name'], parentHops: 0 } },
        { static: '!' },
      ],
    });
  });

  it('tokenizes multiple interpolations', () => {
    const result = tokenizeText('{{ a }}-{{ b }}');
    expect(result).toEqual({
      kind: 'text',
      parts: [
        { expr: { kind: 'path', segments: ['a'], parentHops: 0 } },
        { static: '-' },
        { expr: { kind: 'path', segments: ['b'], parentHops: 0 } },
      ],
    });
  });

  it('throws on an unterminated {{', () => {
    expect(() => tokenizeText('{{ title')).toThrow(TemplateSyntaxError);
  });
});

describe('tokenizeText: triple mustache (raw html)', () => {
  it('tokenizes a sole {{{ }}} as raw-html', () => {
    const result = tokenizeText('{{{ content$ }}}');
    expect(result).toEqual({ kind: 'raw-html', expr: { kind: 'path', segments: ['content$'], parentHops: 0 } });
  });

  it('tolerates surrounding whitespace', () => {
    const result = tokenizeText('  {{{ content$ }}}  ');
    expect(result).toEqual({ kind: 'raw-html', expr: { kind: 'path', segments: ['content$'], parentHops: 0 } });
  });

  it('throws when raw html is mixed with other text before it', () => {
    expect(() => tokenizeText('before {{{ content$ }}}')).toThrow(TemplateSyntaxError);
  });

  it('throws when raw html is mixed with other text after it', () => {
    expect(() => tokenizeText('{{{ content$ }}} after')).toThrow(TemplateSyntaxError);
  });

  it('throws on unterminated {{{', () => {
    expect(() => tokenizeText('{{{ content$')).toThrow(TemplateSyntaxError);
  });
});
