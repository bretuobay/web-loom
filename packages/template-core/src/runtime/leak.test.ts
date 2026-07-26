import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { compile } from '../index.js';
import { createTemplateOutlet } from './outlet.js';

function makeItems(n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: i, text: `item-${i}` }));
}

// 1 root button + 1 conditional span + N keyed each items + 1 partial = fixed, known listener count.
const ITEM_COUNT = 5;
const LISTENERS_PER_MOUNT = 3 + ITEM_COUNT; // root + conditional + items + partial

const LEAK_TEMPLATE = compile(
  `
  <div>
    <button on:click="ping">root</button>
    {{#if visible$}}<span on:click="ping">cond</span>{{/if}}
    <ul>{{#each items$ key=id}}<li on:click="ping">{{ text }}</li>{{/each}}</ul>
    {{> card}}
  </div>
`,
  { partials: { card: '<em on:click="ping">card</em>' } },
);

function makeViewModel() {
  return { visible$: signal(true), items$: signal(makeItems(ITEM_COUNT)), ping: () => {} };
}

describe('leak tests', () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addSpy = vi.spyOn(Element.prototype, 'addEventListener');
    removeSpy = vi.spyOn(Element.prototype, 'removeEventListener');
  });

  afterEach(() => {
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('removes exactly the listeners it added, every cycle, across 50 mount/dispose cycles', () => {
    const vm = makeViewModel();
    const cycles = 50;

    for (let cycle = 0; cycle < cycles; cycle++) {
      const container = document.createElement('div');
      const addBefore = addSpy.mock.calls.length;
      const removeBefore = removeSpy.mock.calls.length;

      const view = LEAK_TEMPLATE.mount(container, vm);
      expect(addSpy.mock.calls.length - addBefore).toBe(LISTENERS_PER_MOUNT);
      expect(removeSpy.mock.calls.length).toBe(removeBefore);

      view.dispose();
      expect(removeSpy.mock.calls.length - removeBefore).toBe(LISTENERS_PER_MOUNT);
      expect(container.childNodes.length).toBe(0);
    }

    expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length);
    expect(addSpy.mock.calls.length).toBe(cycles * LISTENERS_PER_MOUNT);
  });

  it('disposes the previously shown view on every outlet.show() call, not only on outlet.dispose()', () => {
    const vm = makeViewModel();
    const container = document.createElement('div');
    const outlet = createTemplateOutlet(container);
    const cycles = 20;

    for (let cycle = 0; cycle < cycles; cycle++) {
      const removeBefore = removeSpy.mock.calls.length;
      outlet.show(LEAK_TEMPLATE, vm);
      const removedThisCall = removeSpy.mock.calls.length - removeBefore;
      expect(removedThisCall).toBe(cycle === 0 ? 0 : LISTENERS_PER_MOUNT);
      expect(container.childNodes.length).toBeGreaterThan(0);
    }

    const removeBeforeFinal = removeSpy.mock.calls.length;
    outlet.dispose();
    expect(removeSpy.mock.calls.length - removeBeforeFinal).toBe(LISTENERS_PER_MOUNT);
    expect(container.childNodes.length).toBe(0);
    expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length);
  });
});
