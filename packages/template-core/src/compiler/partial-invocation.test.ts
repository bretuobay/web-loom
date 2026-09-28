import { describe, expect, it } from 'vitest';
import { TemplateSyntaxError } from '../errors.js';
import { parsePartialInvocation } from './partial-invocation.js';
import { parseTemplate } from './parser.js';

describe('parsePartialInvocation', () => {
  it('parses a bare name as inherit', () => {
    expect(parsePartialInvocation('header')).toEqual({ name: 'header', context: null, args: null });
  });

  it('parses hyphenated names', () => {
    expect(parsePartialInvocation('greenhouse-card')).toEqual({
      name: 'greenhouse-card',
      context: null,
      args: null,
    });
  });

  it('parses a single context expression', () => {
    expect(parsePartialInvocation('card user$')).toEqual({
      name: 'card',
      context: { kind: 'path', segments: ['user$'], parentHops: 0 },
      args: null,
    });
  });

  it('parses named hash arguments', () => {
    const invocation = parsePartialInvocation('greenhouse-card count=n href="/greenhouses"');
    expect(invocation.name).toBe('greenhouse-card');
    expect(invocation.context).toBeNull();
    expect(invocation.args).toEqual({
      count: { kind: 'path', segments: ['n'], parentHops: 0 },
      href: { kind: 'literal', value: '/greenhouses' },
    });
  });

  it('parses hash values that contain spaces', () => {
    const invocation = parsePartialInvocation('card active=status$ === "on"');
    expect(invocation.args?.active).toEqual({
      kind: 'binary',
      op: '===',
      left: { kind: 'path', segments: ['status$'], parentHops: 0 },
      right: { kind: 'literal', value: 'on' },
    });
  });

  it('rejects a missing value and a duplicate key', () => {
    expect(() => parsePartialInvocation('card count=')).toThrow(TemplateSyntaxError);
    expect(() => parsePartialInvocation('card count=n count=m')).toThrow(TemplateSyntaxError);
  });
});

describe('parseTemplate: partial hash args', () => {
  it('records hash args on the partial block', () => {
    const root = parseTemplate('{{> greenhouse-card count=n href=path}}');
    expect(root.blocks[0]).toMatchObject({
      kind: 'partial',
      name: 'greenhouse-card',
      context: null,
      args: {
        count: { kind: 'path', segments: ['n'], parentHops: 0 },
        href: { kind: 'path', segments: ['path'], parentHops: 0 },
      },
    });
  });

  it('parses a block partial with default and named slots', () => {
    const root = parseTemplate('{{#> card title=name}}Hi{{#slot footer}}Foot{{/slot}}{{/card}}');
    expect(root.blocks[0]).toMatchObject({
      kind: 'partial',
      name: 'card',
      args: { title: { kind: 'path', segments: ['name'], parentHops: 0 } },
    });
    const block = root.blocks[0];
    if (block?.kind !== 'partial') throw new Error('expected partial');
    expect(block.slots?.default).toBeDefined();
    expect(block.slots?.footer).toBeDefined();
  });

  it('keeps a single context expression as context, not args', () => {
    const root = parseTemplate('{{> product-card this}}');
    expect(root.blocks[0]).toMatchObject({
      kind: 'partial',
      name: 'product-card',
      context: { kind: 'path', segments: ['this'], parentHops: 0 },
      args: null,
    });
  });
});
