import { describe, expect, it } from 'vitest';
import { preprocess, decodeMarkerExpr } from './preprocess.js';

describe('preprocess: block tag rewriting', () => {
  it('rewrites {{#if}} / {{else if}} / {{else}} / {{/if}}', () => {
    const out = preprocess('{{#if a}}A{{else if b}}B{{else}}C{{/if}}');
    expect(out).toBe(
      `<!--loom:#if ${encodeURIComponent('a')}-->A<!--loom:else-if ${encodeURIComponent('b')}-->B<!--loom:else-->C<!--loom:/if-->`,
    );
  });

  it('rewrites {{#each}} / {{/each}}', () => {
    const out = preprocess('{{#each todos$ key=id}}<li></li>{{/each}}');
    expect(out).toBe(`<!--loom:#each ${encodeURIComponent('todos$ key=id')}--><li></li><!--loom:/each-->`);
  });

  it('round-trips expression text through encode/decode', () => {
    const out = preprocess('{{#if user.isActive && user.age >= 18}}yes{{/if}}');
    const match = out.match(/<!--loom:#if (.*?)-->/);
    expect(match).not.toBeNull();
    expect(decodeMarkerExpr(match![1]!)).toBe('user.isActive && user.age >= 18');
  });

  it('leaves {{ }} and {{{ }}} interpolations untouched', () => {
    const out = preprocess('<p>{{ title$ }}</p><div>{{{ rawHtml$ }}}</div>');
    expect(out).toBe('<p>{{ title$ }}</p><div>{{{ rawHtml$ }}}</div>');
  });
});

describe('preprocess: comments', () => {
  it('strips {{! comment }} entirely', () => {
    expect(preprocess('a{{! this is dropped }}b')).toBe('ab');
  });

  it('does not treat {{ !expr }} (space before !) as a comment', () => {
    const out = preprocess('{{ !isDone }}');
    expect(out).toBe('{{ !isDone }}');
  });
});

describe('preprocess: standalone-line trimming', () => {
  it('collapses a block tag alone on its own line, leaving no blank line behind', () => {
    const source = ['<ul>', '  {{#each items$ key=id}}', '  <li>{{ text }}</li>', '  {{/each}}', '</ul>'].join('\n');
    const out = preprocess(source);
    // A standalone marker line contributes no *extra* blank line beyond the
    // author's own indentation style (real Mustache leaves normal
    // inter-element whitespace alone — it only removes the whitespace the
    // marker's own line would otherwise add).
    expect(out).not.toMatch(/\n[ \t]*\n/);
    expect(out.match(/<!--loom:#each[^>]*-->/)).not.toBeNull();
    expect(out.match(/<!--loom:\/each-->/)).not.toBeNull();
  });

  it('leaves inline block tags (not alone on a line) untouched aside from the marker rewrite', () => {
    const out = preprocess('<span>{{#if a}}A{{/if}}</span>');
    expect(out).toBe(`<span><!--loom:#if ${encodeURIComponent('a')}-->A<!--loom:/if--></span>`);
  });
});

describe('preprocess: table safety', () => {
  it('keeps {{#each}} markers inside <tbody> after native HTML parsing (no foster-parenting)', () => {
    const source = [
      '<table>',
      '<tbody>',
      '{{#each rows$ key=id}}',
      '<tr><td>{{ name }}</td></tr>',
      '{{/each}}',
      '</tbody>',
      '</table>',
    ].join('\n');
    const out = preprocess(source);

    const templateEl = document.createElement('template');
    templateEl.innerHTML = out;
    const table = templateEl.content.querySelector('table')!;
    const tbody = templateEl.content.querySelector('tbody')!;
    expect(table).not.toBeNull();
    expect(tbody).not.toBeNull();

    const commentInTbody = Array.from(tbody.childNodes).some(
      (n) => n.nodeType === Node.COMMENT_NODE && (n as Comment).data.startsWith('loom:#each'),
    );
    expect(commentInTbody).toBe(true);

    // Nothing was foster-parented before the <table>.
    expect(templateEl.content.firstElementChild).toBe(table);
  });
});
