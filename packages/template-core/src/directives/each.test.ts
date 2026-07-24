import { describe, expect, it, vi } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { parseTemplate } from '../compiler/parser.js';
import { instantiate } from '../runtime/bindings.js';
import { DisposalBag } from '../runtime/disposal.js';
import type { RenderContext, Scope } from '../types.js';

function ctx(): RenderContext {
  return { helpers: {}, escape: true };
}

function mount(source: string, vm: object) {
  const root = parseTemplate(source);
  const scope: Scope = { parent: null, self: vm, locals: {} };
  const bag = new DisposalBag();
  const container = document.createElement('div');
  container.append(instantiate(root, scope, ctx(), bag).fragment);
  return { container, bag };
}

describe('bindEach: rendering', () => {
  it('renders one instance per item in order', () => {
    const todos$ = signal([
      { id: 1, text: 'Milk' },
      { id: 2, text: 'Coffee' },
    ]);
    const { container } = mount('<ul>{{#each todos$ key=id}}<li>{{ text }}</li>{{/each}}</ul>', { todos$ });
    const items = Array.from(container.querySelectorAll('li')).map((li) => li.textContent);
    expect(items).toEqual(['Milk', 'Coffee']);
  });

  it('renders the {{else}} block when the array is empty, and back when populated', () => {
    const todos$ = signal<{ id: number; text: string }[]>([]);
    const { container } = mount(
      '<ul>{{#each todos$ key=id}}<li>{{ text }}</li>{{else}}<li class="empty">Nothing to do</li>{{/each}}</ul>',
      { todos$ },
    );
    expect(container.querySelector('.empty')).not.toBeNull();
    todos$.set([{ id: 1, text: 'Milk' }]);
    expect(container.querySelector('.empty')).toBeNull();
    expect(container.querySelector('li')!.textContent).toBe('Milk');
    todos$.set([]);
    expect(container.querySelector('.empty')).not.toBeNull();
  });

  it('supports key=this for primitive arrays', () => {
    const tags$ = signal(['a', 'b', 'c']);
    const { container } = mount('<ul>{{#each tags$ key=this}}<li>{{ this }}</li>{{/each}}</ul>', { tags$ });
    expect(Array.from(container.querySelectorAll('li')).map((li) => li.textContent)).toEqual(['a', 'b', 'c']);
  });

  it('throws on duplicate keys', () => {
    const items$ = signal([
      { id: 1, text: 'a' },
      { id: 1, text: 'b' },
    ]);
    expect(() => mount('<ul>{{#each items$ key=id}}<li>{{ text }}</li>{{/each}}</ul>', { items$ })).toThrow();
  });
});

describe('bindEach: keyed reconciliation preserves node identity', () => {
  it('preserves DOM nodes for surviving keys on reorder', () => {
    const items$ = signal([
      { id: 1, text: 'A' },
      { id: 2, text: 'B' },
      { id: 3, text: 'C' },
    ]);
    const { container } = mount('<ul>{{#each items$ key=id}}<li>{{ text }}</li>{{/each}}</ul>', { items$ });
    const before = Array.from(container.querySelectorAll('li'));
    const byText = new Map(before.map((li) => [li.textContent, li]));

    items$.set([
      { id: 3, text: 'C' },
      { id: 1, text: 'A' },
      { id: 2, text: 'B' },
    ]);

    const after = Array.from(container.querySelectorAll('li'));
    expect(after.map((li) => li.textContent)).toEqual(['C', 'A', 'B']);
    // same node objects, just moved
    expect(after[0]).toBe(byText.get('C'));
    expect(after[1]).toBe(byText.get('A'));
    expect(after[2]).toBe(byText.get('B'));
  });

  it('inserts and removes only the affected nodes', () => {
    const items$ = signal([
      { id: 1, text: 'A' },
      { id: 2, text: 'B' },
    ]);
    const { container } = mount('<ul>{{#each items$ key=id}}<li>{{ text }}</li>{{/each}}</ul>', { items$ });
    const aNode = container.querySelectorAll('li')[0]!;

    items$.set([
      { id: 1, text: 'A' },
      { id: 3, text: 'C' },
    ]);

    const after = Array.from(container.querySelectorAll('li'));
    expect(after.map((li) => li.textContent)).toEqual(['A', 'C']);
    expect(after[0]).toBe(aNode); // A's node was untouched, not recreated
  });
});

describe('bindEach: same key, new object reference', () => {
  it('re-resolves bindings against the new object while preserving the DOM node', () => {
    const items$ = signal([{ id: 1, text: 'first' }]);
    const { container } = mount('<ul>{{#each items$ key=id}}<li>{{ text }}</li>{{/each}}</ul>', { items$ });
    const li = container.querySelector('li')!;
    expect(li.textContent).toBe('first');

    items$.set([{ id: 1, text: 'second' }]); // same key, new object
    const liAfter = container.querySelector('li')!;
    expect(liAfter).toBe(li);
    expect(liAfter.textContent).toBe('second');
  });
});

describe('bindEach: iteration scope', () => {
  it('exposes this, @index, @first, @last, @even, @odd, correctly after a reorder', () => {
    const items$ = signal([
      { id: 1, text: 'A' },
      { id: 2, text: 'B' },
      { id: 3, text: 'C' },
    ]);
    const { container } = mount(
      '<ul>{{#each items$ key=id}}<li data-first="{{ @first }}" data-last="{{ @last }}" data-parity="{{ @even }}">{{ @index }}:{{ this.text }}</li>{{/each}}</ul>',
      { items$ },
    );
    let lis = Array.from(container.querySelectorAll('li'));
    expect(lis.map((li) => li.textContent)).toEqual(['0:A', '1:B', '2:C']);
    expect(lis[0]!.dataset.first).toBe('true');
    expect(lis[2]!.dataset.last).toBe('true');

    items$.set([
      { id: 3, text: 'C' },
      { id: 1, text: 'A' },
      { id: 2, text: 'B' },
    ]);
    lis = Array.from(container.querySelectorAll('li'));
    expect(lis.map((li) => li.textContent)).toEqual(['0:C', '1:A', '2:B']);
    expect(lis[0]!.dataset.first).toBe('true');
    expect(lis[2]!.dataset.last).toBe('true');
  });

  it('supports ../ to reach the enclosing scope', () => {
    const title$ = signal('Todos');
    const items$ = signal([{ id: 1, text: 'A' }]);
    const { container } = mount('<ul>{{#each items$ key=id}}<li>{{ ../title$ }}: {{ text }}</li>{{/each}}</ul>', {
      title$,
      items$,
    });
    expect(container.querySelector('li')!.textContent).toBe('Todos: A');
  });
});

describe('bindEach: signal-property items bypass the diff', () => {
  it('updates an item signal property with no list-level re-diff', () => {
    const text$ = signal('first');
    const items$ = signal([{ id: 1, text$ }]);
    const { container } = mount('<ul>{{#each items$ key=id}}<li>{{ text$ }}</li>{{/each}}</ul>', { items$ });
    const li = container.querySelector('li')!;
    expect(li.textContent).toBe('first');

    text$.set('second'); // no items$.set() at all — pure item-signal update
    expect(li.textContent).toBe('second');
    expect(container.querySelector('li')).toBe(li); // same node, no re-diff
  });
});

describe('bindEach: disposal', () => {
  it('disposes a removed item instance effects and listeners', () => {
    const clickSpy = vi.fn();
    const items$ = signal([{ id: 1, text: 'A' }]);
    const vm = { items$, onClick: clickSpy };
    const { container } = mount(
      '<ul>{{#each items$ key=id}}<li on:click="onClick">{{ text }}</li>{{/each}}</ul>',
      vm,
    );
    const li = container.querySelector('li')!;
    items$.set([]);
    expect(container.querySelector('li')).toBeNull();
    li.dispatchEvent(new Event('click'));
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('disposes all item instances when the each block itself is disposed', () => {
    const clickSpy = vi.fn();
    const items$ = signal([{ id: 1, text: 'A' }]);
    const root = parseTemplate('<ul>{{#each items$ key=id}}<li on:click="onClick">{{ text }}</li>{{/each}}</ul>');
    const scope: Scope = { parent: null, self: { items$, onClick: clickSpy }, locals: {} };
    const bag = new DisposalBag();
    const container = document.createElement('div');
    container.append(instantiate(root, scope, ctx(), bag).fragment);

    const li = container.querySelector('li')!;
    bag.dispose();
    li.dispatchEvent(new Event('click'));
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
