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

describe('bindIf: branch selection', () => {
  it('mounts the first truthy branch, evaluated top-down', () => {
    const vm = { a: false, b: true, c: true };
    const { container } = mount('{{#if a}}A{{else if b}}B{{else if c}}C{{/if}}', vm);
    expect(container.textContent).toBe('B');
  });

  it('mounts {{else}} when nothing is truthy', () => {
    const vm = { a: false, b: false };
    const { container } = mount('{{#if a}}A{{else if b}}B{{else}}C{{/if}}', vm);
    expect(container.textContent).toBe('C');
  });

  it('mounts nothing when no condition matches and there is no {{else}}', () => {
    const vm = { a: false };
    const { container } = mount('before{{#if a}}A{{/if}}after', vm);
    expect(container.textContent).toBe('beforeafter');
  });

  it('reacts to the condition signal changing', () => {
    const isLoggedIn$ = signal(false);
    const { container } = mount('{{#if isLoggedIn$}}Welcome{{else}}Log in{{/if}}', { isLoggedIn$ });
    expect(container.textContent).toBe('Log in');
    isLoggedIn$.set(true);
    expect(container.textContent).toBe('Welcome');
  });
});

describe('bindIf: branch swap disposal and isolation', () => {
  it('disposes the outgoing branch effects and listeners before mounting the incoming one', () => {
    const show$ = signal(true);
    const inner$ = signal('x');
    const clickSpy = vi.fn();
    const vm = { show$, inner$, onClick: clickSpy };
    const { container } = mount(
      '{{#if show$}}<button on:click="onClick">{{ inner$ }}</button>{{else}}gone{{/if}}',
      vm,
    );
    const button = container.querySelector('button')!;
    expect(button.textContent).toBe('x');

    show$.set(false);
    expect(container.textContent).toBe('gone');

    // The old branch's binding must be fully torn down: neither the signal
    // update nor a (captured) click should do anything now.
    inner$.set('y');
    button.dispatchEvent(new Event('click'));
    expect(clickSpy).not.toHaveBeenCalled();
    expect(container.textContent).toBe('gone');
  });

  it('does not subscribe to a signal referenced only inside an inactive branch', () => {
    const active$ = signal(false);
    const onlyInBranch$ = signal(0);
    let bodyRuns = 0;
    const vm = {
      active$,
      onlyInBranch$,
      get tracked() {
        bodyRuns++;
        return onlyInBranch$.get();
      },
    };
    const { container } = mount('{{#if active$}}{{ tracked }}{{else}}inactive{{/if}}', vm);
    expect(container.textContent).toBe('inactive');
    const runsWhileInactive = bodyRuns;

    onlyInBranch$.set(42); // no subscriber yet — must not trigger any binding evaluation
    expect(bodyRuns).toBe(runsWhileInactive);
    expect(container.textContent).toBe('inactive');
  });

  it('rebuilds a branch from the blueprint on re-entry (no transient DOM state preserved)', () => {
    const show$ = signal(true);
    const { container } = mount('{{#if show$}}<input>{{/if}}', { show$ });
    const input = container.querySelector('input')!;
    input.value = 'typed by user';
    show$.set(false);
    expect(container.querySelector('input')).toBeNull();
    show$.set(true);
    const newInput = container.querySelector('input')!;
    expect(newInput).not.toBe(input);
    expect(newInput.value).toBe('');
  });
});
