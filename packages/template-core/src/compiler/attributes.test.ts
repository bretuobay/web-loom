import { describe, expect, it } from 'vitest';
import { compileAttributes } from './attributes.js';
import { TemplateSyntaxError } from '../errors.js';

function el(html: string): Element {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstElementChild!;
}

describe('compileAttributes: directive extraction', () => {
  it('extracts on:event and removes the attribute', () => {
    const e = el('<button on:click="increment"></button>');
    const bindings = compileAttributes(e, [0]);
    expect(bindings).toEqual([
      { kind: 'event', path: [0], event: 'click', handler: { kind: 'path', segments: ['increment'], parentHops: 0 } },
    ]);
    expect(e.hasAttribute('on:click')).toBe(false);
  });

  it('extracts :name as prop-or-attr', () => {
    const e = el('<input :disabled="isSubmitting$">');
    const bindings = compileAttributes(e, [0]);
    expect(bindings).toEqual([
      {
        kind: 'prop-or-attr',
        path: [0],
        name: 'disabled',
        expr: { kind: 'path', segments: ['isSubmitting$'], parentHops: 0 },
      },
    ]);
    expect(e.hasAttribute(':disabled')).toBe(false);
  });

  it('extracts class:name', () => {
    const e = el('<div class:active="isActive$"></div>');
    const bindings = compileAttributes(e, [0]);
    expect(bindings).toEqual([
      { kind: 'class', path: [0], name: 'active', expr: { kind: 'path', segments: ['isActive$'], parentHops: 0 } },
    ]);
  });

  it('extracts style:prop', () => {
    const e = el('<div style:color="theme$"></div>');
    const bindings = compileAttributes(e, [0]);
    expect(bindings).toEqual([
      { kind: 'style', path: [0], prop: 'color', expr: { kind: 'path', segments: ['theme$'], parentHops: 0 } },
    ]);
  });

  it('rejects event modifiers as not-yet-implemented', () => {
    const e = el('<input on:keydown.enter="addTodo">');
    expect(() => compileAttributes(e, [0])).toThrow(TemplateSyntaxError);
  });

  it('rejects use: and bind: as not-yet-implemented', () => {
    expect(() => compileAttributes(el('<div use:tooltip="cfg"></div>'), [0])).toThrow(TemplateSyntaxError);
    expect(() => compileAttributes(el('<input bind:value="name$">'), [0])).toThrow(TemplateSyntaxError);
  });
});

describe('compileAttributes: plain attributes', () => {
  it('leaves a plain static attribute untouched', () => {
    const e = el('<div id="app"></div>');
    const bindings = compileAttributes(e, [0]);
    expect(bindings).toEqual([]);
    expect(e.getAttribute('id')).toBe('app');
  });

  it('extracts an interpolated plain attribute and neutralizes it', () => {
    const e = el('<img src="{{ photo$ }}">');
    const bindings = compileAttributes(e, [0]);
    expect(bindings).toEqual([
      {
        kind: 'attr-interp',
        path: [0],
        name: 'src',
        parts: [{ expr: { kind: 'path', segments: ['photo$'], parentHops: 0 } }],
      },
    ]);
    expect(e.hasAttribute('src')).toBe(false);
  });

  it('rejects raw HTML interpolation inside an attribute value', () => {
    const e = el('<div title="{{{ html$ }}}"></div>');
    expect(() => compileAttributes(e, [0])).toThrow(TemplateSyntaxError);
  });
});
