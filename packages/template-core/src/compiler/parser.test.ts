import { describe, expect, it } from 'vitest';
import { parseTemplate } from './parser.js';
import { TemplateSyntaxError } from '../errors.js';

function textOf(fragment: DocumentFragment): string {
  const div = document.createElement('div');
  div.appendChild(fragment.cloneNode(true));
  return div.innerHTML;
}

describe('parseTemplate: build-free compilation', () => {
  it('parses a plain template with no build step', () => {
    const root = parseTemplate('<h1>{{ title$ }}</h1>');
    expect(root.blueprint).toBeInstanceOf(DocumentFragment);
    expect(root.bindings).toHaveLength(1);
    expect(root.bindings[0]).toMatchObject({ kind: 'text', path: [0, 0] });
  });

  it('never attaches anything to the live document during compilation', () => {
    parseTemplate('<img src="{{ photo$ }}"><div class:active="isActive$"></div>');
    expect(document.body.querySelector('img')).toBeNull();
    expect(document.body.children.length).toBe(0);
  });
});

describe('parseTemplate: directive and attribute extraction', () => {
  it('strips directive attributes from the blueprint markup', () => {
    const root = parseTemplate('<button on:click="increment" class:active="isOn$">Go</button>');
    const html = textOf(root.blueprint);
    expect(html).not.toContain('on:click');
    expect(html).not.toContain('class:active');
    expect(root.bindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'event', event: 'click' }),
        expect.objectContaining({ kind: 'class', name: 'active' }),
      ]),
    );
  });

  it('neutralizes an interpolated plain attribute in the blueprint', () => {
    const root = parseTemplate('<img src="{{ photo$ }}">');
    const html = textOf(root.blueprint);
    expect(html).not.toContain('{{');
    expect(root.bindings).toEqual([expect.objectContaining({ kind: 'attr-interp', name: 'src' })]);
  });
});

describe('parseTemplate: script/style opacity', () => {
  it('does not tokenize text inside <script>', () => {
    const root = parseTemplate('<script>const x = "{{ notAnExpr }}";</script>');
    expect(root.bindings).toHaveLength(0);
    expect(textOf(root.blueprint)).toContain('{{ notAnExpr }}');
  });

  it('does not tokenize text inside <style>', () => {
    const root = parseTemplate('<style>.a::after { content: "{{ notAnExpr }}"; }</style>');
    expect(root.bindings).toHaveLength(0);
  });
});

describe('parseTemplate: comments', () => {
  it('strips {{! comment }} without creating a binding', () => {
    const root = parseTemplate('<p>{{! internal note }}Hello</p>');
    expect(root.bindings).toHaveLength(0);
    expect(textOf(root.blueprint)).toBe('<p>Hello</p>');
  });
});

describe('parseTemplate: SVG namespace', () => {
  it('parses an SVG-rooted template into the SVG namespace', () => {
    const root = parseTemplate('<circle r="5" :cx="x$"></circle>');
    const circle = root.blueprint.firstElementChild!;
    expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(circle.tagName.toLowerCase()).toBe('circle');
  });

  it('does not wrap a plain HTML root', () => {
    const root = parseTemplate('<div></div>');
    expect(root.blueprint.firstElementChild!.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
  });
});

describe('parseTemplate: malformed blocks', () => {
  it('throws on an unclosed {{#if}}', () => {
    expect(() => parseTemplate('{{#if a}}A')).toThrow(TemplateSyntaxError);
  });

  it('throws on an unclosed {{#each}}', () => {
    expect(() => parseTemplate('{{#each items key=id}}<li></li>')).toThrow(TemplateSyntaxError);
  });

  it('throws on a mismatched close tag', () => {
    expect(() => parseTemplate('{{#if a}}A{{/each}}')).toThrow(TemplateSyntaxError);
  });

  it('throws on a stray close tag with no matching open', () => {
    expect(() => parseTemplate('A{{/if}}')).toThrow(TemplateSyntaxError);
  });

  it('throws when {{#each}} is missing key=', () => {
    expect(() => parseTemplate('{{#each items}}<li></li>{{/each}}')).toThrow(TemplateSyntaxError);
  });

  it('throws when {{else if}} appears inside {{#each}}', () => {
    expect(() => parseTemplate('{{#each items key=id}}<li></li>{{else if x}}<li></li>{{/each}}')).toThrow(
      TemplateSyntaxError,
    );
  });
});

describe('parseTemplate: if/each block structure', () => {
  it('builds branches for {{#if}}/{{else if}}/{{else}}', () => {
    const root = parseTemplate('{{#if a}}A{{else if b}}B{{else}}C{{/if}}');
    expect(root.blocks).toHaveLength(1);
    const block = root.blocks[0]!;
    if (block.kind !== 'if') throw new Error('expected if block');
    expect(block.branches).toHaveLength(3);
    expect(block.branches[0]!.condition).toMatchObject({ kind: 'path', segments: ['a'] });
    expect(block.branches[1]!.condition).toMatchObject({ kind: 'path', segments: ['b'] });
    expect(block.branches[2]!.condition).toBeNull();
  });

  it('builds a keyed each block with an empty branch, addressed inside its parent element', () => {
    const root = parseTemplate('<ul>{{#each todos$ key=id}}<li>{{ text }}</li>{{else}}<li>none</li>{{/each}}</ul>');
    expect(root.blocks).toHaveLength(1);
    const block = root.blocks[0]!;
    if (block.kind !== 'each') throw new Error('expected each block');
    expect(block.path).toEqual([0, 0]); // <ul> is root child 0; the anchor is its child 0
    expect(block.source).toMatchObject({ kind: 'path', segments: ['todos$'] });
    expect(block.key).toEqual({ kind: 'path', segments: ['id'], parentHops: 0 });
    expect(block.empty).toBeDefined();
  });

  it('nests block records correctly inside a parent element', () => {
    const root = parseTemplate('<ul>{{#each todos$ key=id}}<li>{{ text }}</li>{{/each}}</ul>');
    const ul = root.blueprint.firstElementChild!;
    expect(ul.tagName.toLowerCase()).toBe('ul');
    expect(ul.childNodes).toHaveLength(1);
    expect(ul.childNodes[0]!.nodeType).toBe(Node.COMMENT_NODE);
  });

  it('supports nested blocks (each containing if)', () => {
    const root = parseTemplate(
      '<ul>{{#each todos$ key=id}}{{#if done}}<li>done</li>{{else}}<li>pending</li>{{/if}}{{/each}}</ul>',
    );
    const html = textOf(root.blueprint);
    expect(html).toContain('<ul><!--loom:anchor--></ul>');
  });
});

describe('parseTemplate: not-yet-supported directives', () => {
  it('throws for use: and bind:', () => {
    expect(() => parseTemplate('<div use:tooltip="cfg"></div>')).toThrow(TemplateSyntaxError);
    expect(() => parseTemplate('<input bind:value="name$">')).toThrow(TemplateSyntaxError);
  });
});
