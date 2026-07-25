import { describe, expect, it, vi } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { compile as compileBrowser } from '../index.js';
import { compile, fromPrecompiled } from './index.js';
import { precompile } from '../compiler/index.js';

describe('server rendering', () => {
  it('renders Phase 1/2 expressions and blocks without browser DOM APIs', () => {
    const template = compile(`
      <h1>{{ title$ }}</h1>
      {{#switch status$}}{{#case "ready"}}<p>{{ count$ }}</p>{{/case}}{{#default}}Waiting{{/default}}{{/switch}}
      {{#each items$ key=id}}<span>{{ name }}</span>{{/each}}
    `);
    const html = template.renderToString({
      title$: signal('Catalog'),
      status$: signal('ready'),
      count$: signal(3),
      items$: signal([{ id: 1, name: 'Keyboard' }]),
    });
    expect(html).toContain('<h1>Catalog</h1>');
    expect(html).toContain('<p>3</p>');
    expect(html).toContain('<span>Keyboard</span>');
    expect(html).toContain('loom:anchor');
  });

  it('renders partials and omits browser-only directives', () => {
    const template = compile('<button on:click="save" use:focus>{{> card}}</button>', {
      partials: { card: '<strong>{{ title }}</strong>' },
    });
    expect(template.renderToString({ title: '<safe>' })).toContain('<!--loom:anchor--><strong>&lt;safe&gt;</strong>');
    expect(template.renderToString({ title: '<safe>' })).not.toContain('on:click');
  });

  it('supports diagnostics and strict missing partials', () => {
    const warn = vi.fn();
    expect(compile('{{> missing}}', { diagnostics: { warn } }).renderToString({})).toContain('loom:anchor');
    expect(warn).toHaveBeenCalled();
    expect(() => compile('{{> missing}}', { strictPartials: true }).renderToString({})).toThrow(/Missing partial/);
  });

  it('renders precompiled plans through the SSR compiler', () => {
    const module = precompile('<p>{{ message }}</p>', { name: 'Precompiled' });
    expect(fromPrecompiled(module).renderToString({ message: 'hello' })).toBe('<p>hello</p>');
  });
});

describe('browser hydration', () => {
  it('reuses matching simple markup and remains reactive', () => {
    const value$ = signal('before');
    const template = compileBrowser('<p>{{ value$ }}</p>');
    const serverMarkup = template.renderToString({ value$ });
    const container = document.createElement('div');
    container.innerHTML = serverMarkup;
    const existing = container.firstElementChild;
    const view = template.hydrate(container, { value$ });
    expect(container.firstElementChild).toBe(existing);
    value$.set('after');
    expect(container.textContent).toBe('after');
    view.dispose();
  });

  it('hydrates an existing keyed list without replacing its item nodes', () => {
    const items$ = signal([
      { id: 1, name: 'Keyboard' },
      { id: 2, name: 'Mouse' },
    ]);
    const template = compileBrowser('<ul>{{#each items$ key=id}}<li>{{ name }}</li>{{/each}}</ul>');
    const container = document.createElement('div');
    container.innerHTML = template.renderToString({ items$ });
    const existingItems = Array.from(container.querySelectorAll('li'));
    const view = template.hydrate(container, { items$ });

    expect(Array.from(container.querySelectorAll('li'))).toEqual(existingItems);
    items$.set([
      { id: 1, name: 'Updated keyboard' },
      { id: 2, name: 'Mouse' },
    ]);
    expect(container.querySelector('li')?.textContent).toBe('Updated keyboard');
    view.dispose();
  });

  it('warns and recovers when markup does not match', () => {
    const warn = vi.fn();
    const template = compileBrowser('<p>{{ value$ }}</p>', { diagnostics: { warn } });
    const container = document.createElement('div');
    container.innerHTML = '<span>wrong</span>';
    const view = template.hydrate(container, { value$: signal('correct') });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Hydration markup mismatch; remounting the template.'),
      expect.anything(),
    );
    expect(container.querySelector('p')?.textContent).toBe('correct');
    view.dispose();
  });
});
