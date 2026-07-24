import { describe, expect, it } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { DisposalBag } from '../runtime/disposal.js';
import { parseExpression } from '../compiler/expression.js';
import { bindStyle } from './styles.js';
import type { RenderContext, Scope } from '../types.js';

function ctx(): RenderContext {
  return { helpers: {}, escape: true };
}

describe('bindStyle', () => {
  it('sets and reactively updates a CSS property', () => {
    const color$ = signal('red');
    const scope: Scope = { parent: null, self: { color$ }, locals: {} };
    const el = document.createElement('div');
    const bag = new DisposalBag();

    bindStyle({ kind: 'style', path: [0], prop: 'color', expr: parseExpression('color$') }, el, scope, ctx(), bag);
    expect(el.style.color).toBe('red');
    color$.set('blue');
    expect(el.style.color).toBe('blue');
    bag.dispose();
  });

  it('removes the property when the value is null or undefined', () => {
    const color$ = signal<string | null>('red');
    const scope: Scope = { parent: null, self: { color$ }, locals: {} };
    const el = document.createElement('div');
    const bag = new DisposalBag();

    bindStyle({ kind: 'style', path: [0], prop: 'color', expr: parseExpression('color$') }, el, scope, ctx(), bag);
    expect(el.style.color).toBe('red');
    color$.set(null);
    expect(el.style.color).toBe('');
    bag.dispose();
  });
});
