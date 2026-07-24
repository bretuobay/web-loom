import { describe, expect, it, vi } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { compile, TemplateSyntaxError } from './index.js';

describe('compile + Template.mount: public API', () => {
  it('mounts a template into a container and updates reactively', () => {
    const count$ = signal(0);
    const vm = { count$, increment: () => count$.update((n) => n + 1) };
    const template = compile('<button on:click="increment">Count: {{ count$ }}</button>');

    const container = document.createElement('div');
    const view = template.mount(container, vm);

    const button = container.querySelector('button')!;
    expect(button.textContent).toBe('Count: 0');
    button.dispatchEvent(new Event('click'));
    expect(button.textContent).toBe('Count: 1');

    view.dispose();
  });

  it('mounts a template combining {{#if}} and {{#each}} correctly (end-to-end, including nested top-level blocks)', () => {
    const isLoading$ = signal(true);
    const todos$ = signal([{ id: 1, text: 'Milk' }]);
    const vm = { isLoading$, todos$ };
    const template = compile(
      '<div>{{#if isLoading$}}<p>Loading…</p>{{else}}<ul>{{#each todos$ key=id}}<li>{{ text }}</li>{{/each}}</ul>{{/if}}</div>',
    );

    const container = document.createElement('div');
    const view = template.mount(container, vm);
    expect(container.querySelector('p')?.textContent).toBe('Loading…');

    isLoading$.set(false);
    expect(container.querySelector('p')).toBeNull();
    expect(container.querySelector('li')?.textContent).toBe('Milk');

    todos$.set([...todos$.peek(), { id: 2, text: 'Coffee' }]);
    expect(Array.from(container.querySelectorAll('li')).map((li) => li.textContent)).toEqual(['Milk', 'Coffee']);

    view.dispose();
  });

  it('dispose() tears down effects and listeners without touching the ViewModel', () => {
    const count$ = signal(0);
    const clickSpy = vi.fn();
    const vm = { count$, onClick: clickSpy };
    const template = compile('<button on:click="onClick">{{ count$ }}</button>');
    const container = document.createElement('div');
    const view = template.mount(container, vm);
    const button = container.querySelector('button')!;

    view.dispose();

    expect(container.querySelector('button')).toBeNull(); // view removed from the DOM
    button.dispatchEvent(new Event('click'));
    expect(clickSpy).not.toHaveBeenCalled(); // listener gone

    // The ViewModel's own signal is untouched — still perfectly usable.
    expect(() => count$.set(5)).not.toThrow();
    expect(count$.get()).toBe(5);
  });

  it('dispose() is idempotent', () => {
    const template = compile('<p>{{ title$ }}</p>');
    const container = document.createElement('div');
    const view = template.mount(container, { title$: signal('hi') });
    view.dispose();
    expect(() => view.dispose()).not.toThrow();
  });

  it('two mounts of the same Template are independent — disposing one leaves the other reactive', () => {
    const template = compile('<p>{{ title$ }}</p>');
    const titleA$ = signal('A');
    const titleB$ = signal('B');
    const containerA = document.createElement('div');
    const containerB = document.createElement('div');

    const viewA = template.mount(containerA, { title$: titleA$ });
    const viewB = template.mount(containerB, { title$: titleB$ });

    expect(containerA.textContent).toBe('A');
    expect(containerB.textContent).toBe('B');

    viewA.dispose();
    titleA$.set('A2');
    titleB$.set('B2');

    expect(containerA.textContent).toBe(''); // disposed, no longer reactive
    expect(containerB.textContent).toBe('B2'); // untouched, still reactive

    viewB.dispose();
  });
});

describe('Template.render', () => {
  it('returns a detached, already-reactive fragment with a matching dispose()', () => {
    const count$ = signal(0);
    const template = compile('<span>{{ count$ }}</span>');
    const { node, dispose } = template.render({ count$ });

    expect(node).toBeInstanceOf(DocumentFragment);
    const span = node.querySelector('span')!;
    expect(span.textContent).toBe('0');

    count$.set(7); // reactive even while detached
    expect(span.textContent).toBe('7');

    const container = document.createElement('div');
    container.appendChild(node); // caller manages insertion
    expect(container.textContent).toBe('7');

    dispose();
    expect(container.querySelector('span')).toBeNull();
  });
});

describe('compile: error surface', () => {
  it('throws TemplateSyntaxError for malformed templates at compile time', () => {
    expect(() => compile('{{#if a}}unclosed')).toThrow(TemplateSyntaxError);
  });
});
