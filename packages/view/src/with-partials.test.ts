import { describe, expect, it } from 'vitest';
import { compile } from '@web-loom/template-core';
import { defineComponent } from './define-component.js';
import { withPartials } from './with-partials.js';

describe('withPartials', () => {
  it('lets a page import children without the global registry', () => {
    const card = defineComponent<{ title: string }>({
      name: 'card',
      props: ['title'],
      template: compile('<span>{{ title }}</span>'),
    });
    const page = withPartials(compile('<section>{{> card title=name}}</section>'), { card });

    const root = document.createElement('div');
    const view = page.mount(root, { name: 'Ada' });
    expect(root.querySelector('span')?.textContent).toBe('Ada');
    view.dispose();
  });
});
