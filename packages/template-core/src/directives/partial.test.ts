import { describe, expect, it } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { compile } from '../index.js';

describe('partial hash args and isolation', () => {
  it('passes named arguments and does not inherit the caller scope', () => {
    const root = document.createElement('div');
    const view = compile('{{> card count=items$.length href="/list"}}', {
      partials: { card: '<a href="{{ href }}">{{ count }} / {{ secret }}</a>' },
    }).mount(root, { items$: signal(['a', 'b']), href: '/wrong', secret: 'leaked' });

    expect(root.querySelector('a')?.getAttribute('href')).toBe('/list');
    expect(root.textContent).toBe('2 / ');
    view.dispose();
  });

  it('does not allow ../ to walk into the caller from a hash-arg partial', () => {
    const root = document.createElement('div');
    const view = compile('{{> card title=name}}', {
      partials: { card: '<span>{{ title }} {{ ../secret }}</span>' },
    }).mount(root, { name: 'Ada', secret: 'leaked' });

    expect(root.textContent?.trim()).toBe('Ada');
    view.dispose();
  });

  it('keeps inherit behavior for {{> name}} with no arguments', () => {
    const root = document.createElement('div');
    const view = compile('{{> card}}', {
      partials: { card: '<span>{{ title }}</span>' },
    }).mount(root, { title: 'Loom' });

    expect(root.textContent).toBe('Loom');
    view.dispose();
  });

  it('keeps a single context expression and parent walk for {{> name ctx}}', () => {
    const root = document.createElement('div');
    const view = compile('{{> card user$}}', {
      partials: { card: '<span>{{ name }} {{ ../suffix }}</span>' },
    }).mount(root, { user$: signal({ name: 'Ada' }), suffix: 'ok' });

    expect(root.textContent?.trim()).toBe('Ada ok');
    view.dispose();
  });

  it('isolates an opted-in template even when invoked as {{> name}}', () => {
    const card = compile('<span>{{ title }} {{ secret }}</span>', { isolated: true });
    const root = document.createElement('div');
    const view = compile('{{> card}}', { partials: { card } }).mount(root, { title: 'Ada', secret: 'leaked' });

    expect(root.textContent?.trim()).toBe('');
    view.dispose();
  });

  it('renders default and named slots against the caller scope', () => {
    let pings = 0;
    const root = document.createElement('div');
    const view = compile(
      '{{#> card title=name}}Hello {{ name }}{{#slot footer}}<button on:click="ping">{{ label }}</button>{{/slot}}{{/card}}',
      {
        partials: {
          card: '<article><h3>{{ title }}</h3><div>{{> yield}}</div><footer>{{> yield name="footer"}}</footer></article>',
        },
      },
    ).mount(root, { name: 'Ada', label: 'Go', ping: () => pings++ });

    expect(root.querySelector('h3')?.textContent).toBe('Ada');
    expect(root.querySelector('div')?.textContent).toBe('Hello Ada');
    expect(root.querySelector('button')?.textContent).toBe('Go');
    root.querySelector('button')?.dispatchEvent(new Event('click'));
    expect(pings).toBe(1);
    expect(root.textContent).not.toContain('leaked');
    view.dispose();
  });

  it('runs createContext once per mount and disposes it on remount and unmount', () => {
    const title$ = signal('Ada');
    let setups = 0;
    let disposed = 0;
    const card = compile('<span>{{ title }} {{ extra }}</span>', {
      isolated: true,
      createContext(props) {
        setups += 1;
        return {
          context: { ...props, extra: 'setup' },
          dispose: () => {
            disposed += 1;
          },
        };
      },
    });
    const root = document.createElement('div');
    const view = compile('{{> card title=title$}}', { partials: { card } }).mount(root, { title$ });

    expect(root.textContent?.trim()).toBe('Ada setup');
    expect(setups).toBe(1);
    title$.set('Grace');
    expect(root.textContent?.trim()).toBe('Grace setup');
    expect(setups).toBe(2);
    expect(disposed).toBe(1);
    view.dispose();
    expect(disposed).toBe(2);
  });

  it('resolves children from template.partials without the global registry', () => {
    const page = compile('{{> card}}');
    page.partials = { card: '<span>{{ title }}</span>' };
    const root = document.createElement('div');
    const view = page.mount(root, { title: 'Loom' });
    expect(root.textContent).toBe('Loom');
    view.dispose();
  });
});

