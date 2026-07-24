import { describe, expect, it } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { DisposalBag } from '../runtime/disposal.js';
import { parseExpression } from '../compiler/expression.js';
import { bindClass } from './classes.js';
import type { RenderContext, Scope } from '../types.js';

function ctx(): RenderContext {
  return { helpers: {}, escape: true };
}

describe('bindClass', () => {
  it('toggles a class on and off with a boolean signal', () => {
    const isActive$ = signal(false);
    const scope: Scope = { parent: null, self: { isActive$ }, locals: {} };
    const el = document.createElement('div');
    const bag = new DisposalBag();

    bindClass({ kind: 'class', path: [0], name: 'active', expr: parseExpression('isActive$') }, el, scope, ctx(), bag);
    expect(el.classList.contains('active')).toBe(false);
    isActive$.set(true);
    expect(el.classList.contains('active')).toBe(true);
    isActive$.set(false);
    expect(el.classList.contains('active')).toBe(false);
    bag.dispose();
  });

  it('coerces truthy/falsy non-boolean values', () => {
    const count$ = signal(0);
    const scope: Scope = { parent: null, self: { count$ }, locals: {} };
    const el = document.createElement('div');
    const bag = new DisposalBag();
    bindClass({ kind: 'class', path: [0], name: 'has-items', expr: parseExpression('count$') }, el, scope, ctx(), bag);
    expect(el.classList.contains('has-items')).toBe(false);
    count$.set(3);
    expect(el.classList.contains('has-items')).toBe(true);
    bag.dispose();
  });
});
