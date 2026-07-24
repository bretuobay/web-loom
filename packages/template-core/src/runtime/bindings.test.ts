import { describe, expect, it } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { parseTemplate } from '../compiler/parser.js';
import { getNodeAt, cloneBlueprint, instantiate, applyBindings } from './bindings.js';
import { DisposalBag } from './disposal.js';
import type { RenderContext, Scope } from '../types.js';

function ctx(): RenderContext {
  return { helpers: {}, escape: true };
}

describe('getNodeAt', () => {
  it('resolves a top-level node', () => {
    const a = document.createElement('a');
    const b = document.createElement('b');
    expect(getNodeAt([a, b], [1])).toBe(b);
  });

  it('resolves a nested node by walking childNodes', () => {
    const div = document.createElement('div');
    div.innerHTML = '<span>x<em>y</em></span>';
    const em = div.querySelector('em')!;
    // roots[0] = div; div's child 0 = <span>; span's child 1 = <em> (child 0 is the "x" text node)
    expect(getNodeAt([div], [0, 0, 1])).toBe(em);
  });
});

describe('cloneBlueprint', () => {
  it('produces an independent DocumentFragment', () => {
    const root = parseTemplate('<p>hi</p>');
    const clone1 = cloneBlueprint(root);
    const clone2 = cloneBlueprint(root);
    expect(clone1).not.toBe(clone2);
    expect(clone1.firstElementChild!.textContent).toBe('hi');
  });
});

describe('instantiate + applyBindings: end-to-end binding wiring', () => {
  it('wires text, attribute, class, and event bindings from a real parsed template', () => {
    const count$ = signal(0);
    const isActive$ = signal(false);
    const vm = {
      count$,
      isActive$,
      increment: () => count$.set(count$.peek() + 1),
    };
    const root = parseTemplate(
      '<button on:click="increment" class:active="isActive$">Count: {{ count$ }}</button>',
    );
    const scope: Scope = { parent: null, self: vm, locals: {} };
    const bag = new DisposalBag();

    const { fragment } = instantiate(root, scope, ctx(), bag);
    const container = document.createElement('div');
    container.append(fragment);

    const button = container.querySelector('button')!;
    expect(button.textContent).toBe('Count: 0');
    expect(button.classList.contains('active')).toBe(false);

    isActive$.set(true);
    expect(button.classList.contains('active')).toBe(true);

    button.dispatchEvent(new Event('click'));
    expect(button.textContent).toBe('Count: 1');
    expect(count$.get()).toBe(1);

    bag.dispose();
    button.dispatchEvent(new Event('click'));
    expect(count$.get()).toBe(1); // listener removed, no further increments
  });

  it('applyBindings can re-wire against a persisted roots array (same-key/new-reference pattern)', () => {
    const root = parseTemplate('<li>{{ text }}</li>');
    const bag = new DisposalBag();
    const scope1: Scope = { parent: null, self: { text: 'first' }, locals: {} };
    const { roots: nodes } = instantiate(root, scope1, ctx(), bag);
    const li = nodes[0] as HTMLElement;
    expect(li.textContent).toBe('first');

    bag.reset();
    const scope2: Scope = { parent: null, self: { text: 'second' }, locals: {} };
    applyBindings(root, nodes, scope2, ctx(), bag);
    expect(li.textContent).toBe('second');
    expect(nodes[0]).toBe(li); // same DOM node, rebound in place

    bag.dispose();
  });
});
