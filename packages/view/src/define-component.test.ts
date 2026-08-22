import { describe, expect, it } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { compile } from '@web-loom/template-core';
import { defineComponent } from './define-component.js';

describe('defineComponent', () => {
  it('exposes only declared props and setup keys', () => {
    const card = defineComponent<{ title: string }>({
      name: 'card',
      props: ['title'],
      template: compile('<span>{{ title }} {{ extra }} {{ secret }}</span>'),
      setup() {
        return { extra: 'ok' };
      },
    });

    const root = document.createElement('div');
    const view = compile('{{> card title=name}}', { partials: { card } }).mount(root, {
      name: 'Ada',
      secret: 'leaked',
    });

    expect(root.textContent?.trim()).toBe('Ada ok');
    view.dispose();
  });

  it('disposes setup when the parent view unmounts or props change', () => {
    const title$ = signal('Ada');
    let disposed = 0;
    const card = defineComponent<{ title: string }>({
      name: 'card',
      props: ['title'],
      template: compile('<span>{{ title }}</span>'),
      setup() {
        return {
          dispose: () => {
            disposed += 1;
          },
        };
      },
    });

    const root = document.createElement('div');
    const view = compile('{{> card title=title$}}', { partials: { card } }).mount(root, { title$ });
    expect(root.textContent).toBe('Ada');
    title$.set('Grace');
    expect(disposed).toBe(1);
    view.dispose();
    expect(disposed).toBe(2);
  });
});
