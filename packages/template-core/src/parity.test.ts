import { beforeAll, describe, expect, it } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { compile as compileBrowser } from './index.js';
import { compile as compileSsr } from './ssr/index.js';

/**
 * Compiles the same template+context through both the browser (jsdom) and
 * SSR renderers and asserts they agree on the logically relevant output.
 * Raw HTML/string diffing between the two is deliberately avoided — the
 * renderers' anchor-comment/whitespace conventions legitimately differ —
 * in favor of DOM-property assertions on the browser side and
 * substring/escaping assertions on the SSR string side.
 */
describe('browser/SSR parity', () => {
  it('text interpolation escapes on both renderers', () => {
    const vm = { greeting$: signal('Hello'), name: '<script>' };

    const container = document.createElement('div');
    const view = compileBrowser<typeof vm>('<p>{{ greeting$ }}, <b>{{ name }}</b>!</p>').mount(container, vm);
    expect(container.querySelector('b')!.textContent).toBe('<script>');
    expect(container.querySelector('script')).toBeNull();
    view.dispose();

    const html = compileSsr<typeof vm>('<p>{{ greeting$ }}, <b>{{ name }}</b>!</p>').renderToString(vm);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('attribute bindings agree on value/disabled/data-* semantics', () => {
    const vm = { title$: signal('Widget'), value$: signal('green'), disabled$: signal(true), id$: signal(42) };
    const template = '<input title="{{ title$ }}" :value="value$" :disabled="disabled$" data-id="{{ id$ }}">';

    const container = document.createElement('div');
    const view = compileBrowser<typeof vm>(template).mount(container, vm);
    const input = container.querySelector('input')!;
    expect(input.getAttribute('title')).toBe('Widget');
    expect(input.value).toBe('green');
    expect(input.disabled).toBe(true);
    expect(input.getAttribute('data-id')).toBe('42');
    view.dispose();

    const html = compileSsr<typeof vm>(template).renderToString(vm);
    expect(html).toContain('title="Widget"');
    expect(html).toContain('value="green"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('data-id="42"');
  });

  it('URL attribute values pass through with attribute-value escaping intact on both renderers', () => {
    const vm = { url$: signal('https://example.com/a?b=1&c=2') };
    const template = '<a href="{{ url$ }}">link</a>';

    const container = document.createElement('div');
    const view = compileBrowser<typeof vm>(template).mount(container, vm);
    expect(container.querySelector('a')!.getAttribute('href')).toBe('https://example.com/a?b=1&c=2');
    view.dispose();

    const html = compileSsr<typeof vm>(template).renderToString(vm);
    expect(html).toContain('href="https://example.com/a?b=1&amp;c=2"');
  });

  it('raw HTML renders identical structure on both renderers', () => {
    const vm = { html$: signal('<em>hi</em> &amp; <strong>x</strong>') };
    const template = '<div>{{{ html$ }}}</div>';

    const container = document.createElement('div');
    const view = compileBrowser<typeof vm>(template).mount(container, vm);
    expect(container.querySelectorAll('em').length).toBe(1);
    expect(container.querySelector('em')!.textContent).toBe('hi');
    expect(container.querySelector('strong')!.textContent).toBe('x');

    // Cross-check: parsing the SSR raw-HTML payload independently produces equivalent markup
    // (checked before dispose(), which removes the raw-HTML nodes it inserted). The browser
    // renderer also leaves an internal anchor comment among the raw-HTML siblings, so it's
    // stripped before comparing — it's an implementation detail, not part of the rendered markup.
    const probe = document.createElement('div');
    probe.innerHTML = '<em>hi</em> &amp; <strong>x</strong>';
    const browserMarkup = container.querySelector('div')!.innerHTML.replace(/<!--.*?-->/g, '');
    expect(browserMarkup).toBe(probe.innerHTML);
    view.dispose();

    const html = compileSsr<typeof vm>(template).renderToString(vm);
    expect(html).toContain('<em>hi</em> &amp; <strong>x</strong>');
  });

  it('boolean DOM properties agree between renderers', () => {
    const template = '<input type="checkbox" :checked="checked$">';

    for (const checked of [false, true]) {
      const vm = { checked$: signal(checked) };
      const container = document.createElement('div');
      const view = compileBrowser<typeof vm>(template).mount(container, vm);
      expect(container.querySelector('input')!.checked).toBe(checked);
      view.dispose();

      const html = compileSsr<typeof vm>(template).renderToString(vm);
      if (checked) expect(html).toContain('checked=""');
      else expect(html).not.toContain('checked');
    }
  });

  it('form two-way bind:value agrees between renderers', () => {
    const vm = { text$: signal('abc') };
    const template = '<input bind:value="text$">';

    const container = document.createElement('div');
    const view = compileBrowser<typeof vm>(template).mount(container, vm);
    expect(container.querySelector('input')!.value).toBe('abc');
    view.dispose();

    const html = compileSsr<typeof vm>(template).renderToString(vm);
    expect(html).toContain('value="abc"');
  });

  it('SVG elements render in the SVG namespace on the browser and preserve case in SSR output', () => {
    const vm = { cx$: signal(5), cy$: signal(5), r$: signal(3) };
    const template = '<svg viewBox="0 0 10 10"><circle :cx="cx$" :cy="cy$" r="{{ r$ }}" /></svg>';

    const container = document.createElement('div');
    const view = compileBrowser<typeof vm>(template).mount(container, vm);
    const circle = container.querySelector('circle')!;
    expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(circle.getAttribute('cx')).toBe('5');
    view.dispose();

    const html = compileSsr<typeof vm>(template).renderToString(vm);
    expect(html).toContain('viewBox="0 0 10 10"');
    expect(html).toContain('cx="5"');
  });

  describe('custom elements', () => {
    beforeAll(() => {
      if (!customElements.get('my-widget')) {
        customElements.define('my-widget', class extends HTMLElement {});
      }
    });

    it('renders attributes and slotted content identically, and strips the on: directive on both', () => {
      const vm = { label$: signal('X'), text$: signal('Y'), onClick: () => {} };
      const template = '<my-widget :label="label$" on:click="onClick"><span slot="body">{{ text$ }}</span></my-widget>';

      const container = document.createElement('div');
      const view = compileBrowser<typeof vm>(template).mount(container, vm);
      const widget = container.querySelector('my-widget')!;
      expect(widget).toBeInstanceOf(customElements.get('my-widget'));
      expect(widget.getAttribute('label')).toBe('X');
      expect(widget.querySelector('span')!.textContent).toBe('Y');
      view.dispose();

      const html = compileSsr<typeof vm>(template).renderToString(vm);
      expect(html).toContain('<my-widget label="X">');
      expect(html).toContain('<span slot="body">Y</span>');
      expect(html).not.toContain('on:click');
    });
  });
});
