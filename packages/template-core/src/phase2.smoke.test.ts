import { describe, expect, it } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { compile, registerPartial, unregisterPartial } from './index.js';

describe('phase 2 smoke coverage', () => {
  it('switches branches and binds controls', () => {
    const mode = signal('a');
    const name = signal('Ada');
    const root = document.createElement('div');
    const view = compile(
      '{{#switch mode}}{{#case "a"}}<input bind:value="name">{{/case}}{{#default}}B{{/default}}{{/switch}}',
    ).mount(root, { mode, name });
    const input = root.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('Ada');
    input.value = 'Grace';
    input.dispatchEvent(new Event('input'));
    expect(name.get()).toBe('Grace');
    mode.set('b');
    expect(root.textContent).toBe('B');
    view.dispose();
  });

  it('mounts and disposes partials and actions', () => {
    const value = signal('x');
    let cleaned = 0;
    registerPartial('p2-smoke', '<span>{{ value }}</span>');
    const root = document.createElement('div');
    const view = compile('{{> p2-smoke}}<i use:action="action"></i>', {
      helpers: { action: () => ({ dispose: () => cleaned++ }) },
    }).mount(root, { value });
    expect(root.textContent).toContain('x');
    view.dispose();
    expect(cleaned).toBe(1);
    unregisterPartial('p2-smoke');
  });
});
