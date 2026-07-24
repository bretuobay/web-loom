import { describe, expect, it } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { DisposalBag } from '../runtime/disposal.js';
import { parseExpression } from '../compiler/expression.js';
import { bindText, bindRawHtml } from './text.js';
import type { RenderContext, Scope, TextPart } from '../types.js';

function ctx(): RenderContext {
  return { helpers: {}, escape: true };
}

describe('bindText', () => {
  it('renders and reactively updates a single interpolation', () => {
    const count$ = signal(0);
    const scope: Scope = { parent: null, self: { count$ }, locals: {} };
    const node = document.createTextNode('');
    const bag = new DisposalBag();
    const parts: TextPart[] = [{ expr: parseExpression('count$') }];

    bindText({ kind: 'text', path: [0], parts }, node, scope, ctx(), bag);
    expect(node.textContent).toBe('0');
    count$.set(5);
    expect(node.textContent).toBe('5');
    bag.dispose();
  });

  it('joins static and expression parts', () => {
    const scope: Scope = { parent: null, self: { name: 'Ada' }, locals: {} };
    const node = document.createTextNode('');
    const bag = new DisposalBag();
    const parts: TextPart[] = [{ static: 'Hello ' }, { expr: parseExpression('name') }, { static: '!' }];

    bindText({ kind: 'text', path: [0], parts }, node, scope, ctx(), bag);
    expect(node.textContent).toBe('Hello Ada!');
    bag.dispose();
  });

  it('escapes HTML-special characters by using textContent (no markup injection)', () => {
    const scope: Scope = { parent: null, self: { html: '<img src=x onerror=alert(1)>' }, locals: {} };
    const node = document.createTextNode('');
    const container = document.createElement('div');
    container.appendChild(node);
    const bag = new DisposalBag();

    bindText({ kind: 'text', path: [0], parts: [{ expr: parseExpression('html') }] }, node, scope, ctx(), bag);
    expect(container.querySelector('img')).toBeNull();
    expect(container.innerHTML).toContain('&lt;img');
    bag.dispose();
  });

  it('renders null/undefined as an empty string', () => {
    const scope: Scope = { parent: null, self: { missing: undefined }, locals: {} };
    const node = document.createTextNode('');
    const bag = new DisposalBag();
    bindText({ kind: 'text', path: [0], parts: [{ expr: parseExpression('missing') }] }, node, scope, ctx(), bag);
    expect(node.textContent).toBe('');
    bag.dispose();
  });

  it('stops updating after dispose', () => {
    const count$ = signal(0);
    const scope: Scope = { parent: null, self: { count$ }, locals: {} };
    const node = document.createTextNode('');
    const bag = new DisposalBag();
    bindText({ kind: 'text', path: [0], parts: [{ expr: parseExpression('count$') }] }, node, scope, ctx(), bag);
    bag.dispose();
    count$.set(99);
    expect(node.textContent).toBe('0');
  });
});

describe('bindRawHtml', () => {
  it('parses and inserts raw HTML after the anchor', () => {
    const html$ = signal('<b>bold</b>');
    const scope: Scope = { parent: null, self: { html$ }, locals: {} };
    const container = document.createElement('div');
    const anchor = document.createComment('loom:raw-html');
    container.appendChild(anchor);
    const bag = new DisposalBag();

    bindRawHtml({ kind: 'raw-html', path: [0], expr: parseExpression('html$') }, anchor, scope, ctx(), bag);
    expect(container.querySelector('b')?.textContent).toBe('bold');

    html$.set('<i>italic</i>');
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('i')?.textContent).toBe('italic');
    bag.dispose();
  });

  it('removes inserted nodes on dispose', () => {
    const scope: Scope = { parent: null, self: { html: '<span>x</span>' }, locals: {} };
    const container = document.createElement('div');
    const anchor = document.createComment('loom:raw-html');
    container.appendChild(anchor);
    const bag = new DisposalBag();

    bindRawHtml({ kind: 'raw-html', path: [0], expr: parseExpression('html') }, anchor, scope, ctx(), bag);
    expect(container.querySelector('span')).not.toBeNull();
    bag.dispose();
    expect(container.querySelector('span')).toBeNull();
  });
});
