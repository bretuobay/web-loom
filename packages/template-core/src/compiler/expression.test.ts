import { describe, expect, it } from 'vitest';
import { parseExpression } from './expression.js';
import { TemplateSyntaxError } from '../errors.js';

describe('parseExpression: literals', () => {
  it('parses string literals with both quote styles', () => {
    expect(parseExpression('"hello"')).toEqual({ kind: 'literal', value: 'hello' });
    expect(parseExpression("'world'")).toEqual({ kind: 'literal', value: 'world' });
  });

  it('parses escape sequences in strings', () => {
    expect(parseExpression('"a\\nb"')).toEqual({ kind: 'literal', value: 'a\nb' });
    expect(parseExpression('"quote: \\""')).toEqual({ kind: 'literal', value: 'quote: "' });
  });

  it('parses number literals, including negative and decimal', () => {
    expect(parseExpression('42')).toEqual({ kind: 'literal', value: 42 });
    expect(parseExpression('-3.5')).toEqual({ kind: 'literal', value: -3.5 });
  });

  it('parses true/false/null as literals, not paths', () => {
    expect(parseExpression('true')).toEqual({ kind: 'literal', value: true });
    expect(parseExpression('false')).toEqual({ kind: 'literal', value: false });
    expect(parseExpression('null')).toEqual({ kind: 'literal', value: null });
  });

  it('treats word-prefixed identifiers as paths, not literals', () => {
    expect(parseExpression('truthy')).toEqual({ kind: 'path', segments: ['truthy'], parentHops: 0 });
  });
});

describe('parseExpression: paths', () => {
  it('parses a bare identifier', () => {
    expect(parseExpression('count$')).toEqual({ kind: 'path', segments: ['count$'], parentHops: 0 });
  });

  it('parses dotted paths', () => {
    expect(parseExpression('user.profile.name')).toEqual({
      kind: 'path',
      segments: ['user', 'profile', 'name'],
      parentHops: 0,
    });
  });

  it('parses "this"', () => {
    expect(parseExpression('this')).toEqual({ kind: 'path', segments: ['this'], parentHops: 0 });
  });

  it('parses "this.prop"', () => {
    expect(parseExpression('this.text')).toEqual({ kind: 'path', segments: ['this', 'text'], parentHops: 0 });
  });

  it('parses parent hops', () => {
    expect(parseExpression('../title')).toEqual({ kind: 'path', segments: ['title'], parentHops: 1 });
    expect(parseExpression('../../title')).toEqual({ kind: 'path', segments: ['title'], parentHops: 2 });
  });

  it('parses iteration helper locals', () => {
    expect(parseExpression('@index')).toEqual({ kind: 'path', segments: ['@index'], parentHops: 0 });
    expect(parseExpression('@first')).toEqual({ kind: 'path', segments: ['@first'], parentHops: 0 });
  });

  it('parses $event', () => {
    expect(parseExpression('$event')).toEqual({ kind: 'path', segments: ['$event'], parentHops: 0 });
  });

  it('rejects a bare "$" that is not $event', () => {
    expect(() => parseExpression('$foo')).toThrow(TemplateSyntaxError);
  });
});

describe('parseExpression: helper/handler calls', () => {
  it('parses a call with no arguments', () => {
    expect(parseExpression('increment()')).toEqual({ kind: 'helper-call', callee: 'increment', args: [] });
  });

  it('parses a call with arguments', () => {
    expect(parseExpression('remove(this)')).toEqual({
      kind: 'helper-call',
      callee: 'remove',
      args: [{ kind: 'path', segments: ['this'], parentHops: 0 }],
    });
  });

  it('parses a call with multiple arguments', () => {
    expect(parseExpression('setPage(@index, $event)')).toEqual({
      kind: 'helper-call',
      callee: 'setPage',
      args: [
        { kind: 'path', segments: ['@index'], parentHops: 0 },
        { kind: 'path', segments: ['$event'], parentHops: 0 },
      ],
    });
  });

  it('rejects method-call chains', () => {
    expect(() => parseExpression('vm.remove(this)')).toThrow(TemplateSyntaxError);
  });

  it('rejects calling a parent-hop path', () => {
    expect(() => parseExpression('../remove(this)')).toThrow(TemplateSyntaxError);
  });
});

describe('parseExpression: unary, comparisons, logical', () => {
  it('parses unary not', () => {
    expect(parseExpression('!isDone')).toEqual({
      kind: 'unary-not',
      operand: { kind: 'path', segments: ['isDone'], parentHops: 0 },
    });
  });

  it('parses comparisons', () => {
    const cases: Array<['===' | '!==' | '<' | '<=' | '>' | '>=', string]> = [
      ['===', 'a === b'],
      ['!==', 'a !== b'],
      ['<', 'a < b'],
      ['<=', 'a <= b'],
      ['>', 'a > b'],
      ['>=', 'a >= b'],
    ];
    for (const [op, src] of cases) {
      expect(parseExpression(src)).toEqual({
        kind: 'binary',
        op,
        left: { kind: 'path', segments: ['a'], parentHops: 0 },
        right: { kind: 'path', segments: ['b'], parentHops: 0 },
      });
    }
  });

  it('parses logical operators with correct precedence', () => {
    expect(parseExpression('a && b || c')).toEqual({
      kind: 'logical',
      op: '||',
      left: {
        kind: 'logical',
        op: '&&',
        left: { kind: 'path', segments: ['a'], parentHops: 0 },
        right: { kind: 'path', segments: ['b'], parentHops: 0 },
      },
      right: { kind: 'path', segments: ['c'], parentHops: 0 },
    });
  });

  it('parses nullish coalescing', () => {
    expect(parseExpression('a ?? b')).toEqual({
      kind: 'logical',
      op: '??',
      left: { kind: 'path', segments: ['a'], parentHops: 0 },
      right: { kind: 'path', segments: ['b'], parentHops: 0 },
    });
  });

  it('respects parentheses', () => {
    expect(parseExpression('!(a && b)')).toEqual({
      kind: 'unary-not',
      operand: {
        kind: 'logical',
        op: '&&',
        left: { kind: 'path', segments: ['a'], parentHops: 0 },
        right: { kind: 'path', segments: ['b'], parentHops: 0 },
      },
    });
  });
});

describe('parseExpression: rejects disallowed constructs', () => {
  it.each([
    ['assignment', 'a = b'],
    ['addition', 'a + b'],
    ['subtraction', 'a - b'],
    ['multiplication', 'a * b'],
    ['division', 'a / b'],
    ['modulo', 'a % b'],
    ['ternary', 'a ? b : c'],
    ['new', 'new Foo()'],
    ['template literal', '`hello ${name}`'],
  ])('rejects %s', (_label, src) => {
    expect(() => parseExpression(src)).toThrow(TemplateSyntaxError);
  });

  it('rejects trailing garbage', () => {
    expect(() => parseExpression('a b')).toThrow(TemplateSyntaxError);
  });

  it('rejects an unterminated string', () => {
    expect(() => parseExpression('"unterminated')).toThrow(TemplateSyntaxError);
  });

  it('rejects an empty expression', () => {
    expect(() => parseExpression('')).toThrow(TemplateSyntaxError);
  });
});
