import { describe, expect, it, vi } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { compile, createTemplateOutlet, createTemplateRegistry } from './index.js';

function mount(template: ReturnType<typeof compile>, viewModel: object) {
  const container = document.createElement('div');
  const view = template.mount(container, viewModel);
  return { container, view };
}

describe('integration APIs', () => {
  it('resolves local partials before a scoped registry', () => {
    const registry = createTemplateRegistry({ card: '<strong>registry</strong>' });
    const template = compile('{{> card}}', {
      registry,
      partials: { card: '<strong>local</strong>' },
    });
    const { container, view } = mount(template, {});
    expect(container.textContent).toBe('local');
    view.dispose();
  });

  it('replaces and disposes views through a template outlet', () => {
    const container = document.createElement('div');
    const outlet = createTemplateOutlet(container);
    const first = compile('<p>first</p>');
    const second = compile('<p>second</p>');

    outlet.show(first, {});
    expect(container.textContent).toBe('first');
    outlet.show(second, {});
    expect(container.textContent).toBe('second');
    outlet.clear();
    expect(container.textContent).toBe('');
    outlet.dispose();
    expect(() => outlet.show(first, {})).toThrow(/disposed TemplateOutlet/);
  });

  it('reports recursive partial expansion with the partial chain', () => {
    const template = compile('{{> loop}}', { partials: { loop: '{{> loop}}' } });
    expect(() => mount(template, {})).toThrow('Recursive partial expansion: loop → loop');
  });

  it('supports strict and diagnostic missing-partial behavior', () => {
    const warn = vi.fn();
    const template = compile('{{> missing}}', { diagnostics: { warn } });
    const { container, view } = mount(template, {});
    expect(container.textContent).toBe('');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Missing partial "missing".'), expect.anything());
    view.dispose();

    expect(() => mount(compile('{{> missing}}', { strictPartials: true }), {})).toThrow('Missing partial "missing".');
  });

  it('uses bind:set for plain form snapshots', () => {
    const updates: string[] = [];
    const template = compile('<input bind:value="form.email" bind:set="setEmail">');
    const { container, view } = mount(template, {
      form: signal({ email: 'ada@example.com' }),
      setEmail: (value: string) => updates.push(value),
    });
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('ada@example.com');
    input.value = 'grace@example.com';
    input.dispatchEvent(new Event('input'));
    expect(updates).toEqual(['grace@example.com']);
    view.dispose();
  });

  it('updates an action when its reactive factory changes', () => {
    const updates = vi.fn();
    const disposals = vi.fn();
    const action = (element: Element) => {
      element.setAttribute('data-action', 'active');
      return { update: updates, dispose: disposals };
    };
    const version$ = signal(0);
    const template = compile('<div use:action="makeAction(version$)"></div>', {
      helpers: { makeAction: () => action },
    });
    const { view } = mount(template, { version$ });
    version$.set(1);
    expect(updates).toHaveBeenCalledOnce();
    view.dispose();
    expect(disposals).toHaveBeenCalledOnce();
  });
});
