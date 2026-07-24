import { describe, expect, it } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { DisposalBag } from '../runtime/disposal.js';
import { parseExpression } from '../compiler/expression.js';
import { bindAttrInterp, bindPropOrAttr } from './attributes.js';
import type { RenderContext, Scope, TextPart } from '../types.js';

function ctx(): RenderContext {
  return { helpers: {}, escape: true };
}

describe('bindAttrInterp', () => {
  it('sets and reactively updates an interpolated attribute', () => {
    const photo$ = signal('a.jpg');
    const scope: Scope = { parent: null, self: { photo$ }, locals: {} };
    const el = document.createElement('img');
    const bag = new DisposalBag();
    const parts: TextPart[] = [{ expr: parseExpression('photo$') }];

    bindAttrInterp({ kind: 'attr-interp', path: [0], name: 'src', parts }, el, scope, ctx(), bag);
    expect(el.getAttribute('src')).toBe('a.jpg');
    photo$.set('b.jpg');
    expect(el.getAttribute('src')).toBe('b.jpg');
    bag.dispose();
  });
});

describe('bindPropOrAttr', () => {
  it('assigns a DOM property when the name is a live property (value)', () => {
    const name$ = signal('Ada');
    const scope: Scope = { parent: null, self: { name$ }, locals: {} };
    const el = document.createElement('input');
    const bag = new DisposalBag();

    bindPropOrAttr({ kind: 'prop-or-attr', path: [0], name: 'value', expr: parseExpression('name$') }, el, scope, ctx(), bag);
    expect(el.value).toBe('Ada');
    name$.set('Grace');
    expect(el.value).toBe('Grace');
    bag.dispose();
  });

  it('assigns the checked property with a boolean value', () => {
    const checked$ = signal(false);
    const scope: Scope = { parent: null, self: { checked$ }, locals: {} };
    const el = document.createElement('input');
    el.type = 'checkbox';
    const bag = new DisposalBag();

    bindPropOrAttr(
      { kind: 'prop-or-attr', path: [0], name: 'checked', expr: parseExpression('checked$') },
      el,
      scope,
      ctx(),
      bag,
    );
    expect(el.checked).toBe(false);
    checked$.set(true);
    expect(el.checked).toBe(true);
    bag.dispose();
  });

  it('uses setAttribute for a non-property name (aria-*)', () => {
    const label$ = signal('Close');
    const scope: Scope = { parent: null, self: { label$ }, locals: {} };
    const el = document.createElement('button');
    const bag = new DisposalBag();

    bindPropOrAttr(
      { kind: 'prop-or-attr', path: [0], name: 'aria-label', expr: parseExpression('label$') },
      el,
      scope,
      ctx(),
      bag,
    );
    expect(el.getAttribute('aria-label')).toBe('Close');
    bag.dispose();
  });

  it('toggles attribute presence for a boolean value on a non-property attribute', () => {
    const hidden$ = signal(true);
    const scope: Scope = { parent: null, self: { hidden$ }, locals: {} };
    const el = document.createElement('button');
    const bag = new DisposalBag();

    bindPropOrAttr(
      { kind: 'prop-or-attr', path: [0], name: 'data-hidden', expr: parseExpression('hidden$') },
      el,
      scope,
      ctx(),
      bag,
    );
    expect(el.hasAttribute('data-hidden')).toBe(true);
    hidden$.set(false);
    expect(el.hasAttribute('data-hidden')).toBe(false);
    bag.dispose();
  });

  it('removes the attribute for a nullish value', () => {
    const scope: Scope = { parent: null, self: { v: null }, locals: {} };
    const el = document.createElement('div');
    el.setAttribute('data-x', 'preexisting');
    const bag = new DisposalBag();
    bindPropOrAttr({ kind: 'prop-or-attr', path: [0], name: 'data-x', expr: parseExpression('v') }, el, scope, ctx(), bag);
    expect(el.hasAttribute('data-x')).toBe(false);
    bag.dispose();
  });
});
