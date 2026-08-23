import { describe, expect, it } from 'vitest';
import { analyzeTemplate, precompileNode } from './node.js';
import { TemplateSyntaxError } from '../errors.js';

describe('analyzeTemplate', () => {
  it('returns a compiled plan with bindings and blocks in Node', () => {
    const result = analyzeTemplate('<button on:click="save">{{ title$ }}</button>', {
      name: 'Header',
      sourcePath: 'src/header.ts',
    });
    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.plan.root?.compiled).toBe(true);
    expect(result.plan.root?.bindings.length).toBeGreaterThan(0);
    expect(result.plan.sourceMap?.['0']).toEqual(expect.objectContaining({ line: 1, column: 1 }));
  });

  it('reports invalid expressions without throwing', () => {
    const result = analyzeTemplate('<p>{{ count + 1 }}</p>', {
      name: 'Counter',
      sourcePath: 'src/counter.ts',
    });
    expect(result.ok).toBe(false);
    expect(result.plan.root).toBeUndefined();
    expect(result.diagnostics[0]).toMatchObject({
      code: 'INVALID_EXPRESSION',
      severity: 'error',
      template: 'Counter',
      sourcePath: 'src/counter.ts',
      line: 1,
    });
  });

  it('reports template syntax errors as INVALID_TEMPLATE', () => {
    const result = analyzeTemplate('{{#if a}}A', { name: 'Broken' });
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'INVALID_TEMPLATE',
      severity: 'error',
    });
  });

  it('reports modifier conflicts with MODIFIER_CONFLICT', () => {
    const result = analyzeTemplate('<button on:click.prevent.passive="save"></button>');
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe('MODIFIER_CONFLICT');
  });

  it('warns on raw HTML bindings at analyze time', () => {
    const result = analyzeTemplate('<div>{{{ html }}}</div>');
    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ code: 'RAW_HTML_UNSANITIZED', severity: 'warning' }),
    ]);
  });

  it('warns on statically unsafe URL schemes in bound attributes', () => {
    const result = analyzeTemplate('<a :href="\'javascript:alert(1)\'">link</a>');
    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([expect.objectContaining({ code: 'UNSAFE_URL_SCHEME', severity: 'warning' })]);
  });

  it('warns on missing partials when a partial manifest is provided', () => {
    const result = analyzeTemplate('{{> card}}', {
      name: 'Page',
      partials: { header: '<header></header>' },
    });
    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ code: 'MISSING_PARTIAL', severity: 'warning', details: { partial: 'card' } }),
    ]);
  });

  it('treats missing partials as errors when strictPartials is true', () => {
    const result = analyzeTemplate('{{> card}}', { partials: {}, strictPartials: true });
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({ code: 'MISSING_PARTIAL', severity: 'error' });
  });

  it('warns when a hash-arg call is missing a declared prop', () => {
    const result = analyzeTemplate('{{> card count=n}}', {
      name: 'Page',
      partials: { card: '<span></span>' },
      partialProps: { card: ['count', 'href'] },
    });
    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: 'MISSING_PARTIAL_PROP',
        severity: 'warning',
        details: expect.objectContaining({ partial: 'card', prop: 'href' }),
      }),
    ]);
  });

  it('warns on unknown hash args and suggests near-miss names', () => {
    const result = analyzeTemplate('{{> card count=n href=path hrf=path}}', {
      partials: { card: '<span></span>' },
      partialProps: { card: ['count', 'href'] },
    });
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: 'UNKNOWN_PARTIAL_PROP',
        message: 'Unknown prop "hrf" on partial "card". Did you mean "href"?',
      }),
    ]);
  });

  it('treats prop mismatches as errors when strictPartials is true', () => {
    const result = analyzeTemplate('{{> card}}', {
      partials: { card: '<span></span>' },
      partialProps: { card: ['count'] },
      strictPartials: true,
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({ code: 'MISSING_PARTIAL_PROP', severity: 'error' });
  });

  it('does not require listed props for the legacy context form', () => {
    const result = analyzeTemplate('{{> card user$}}', {
      partials: { card: '<span></span>' },
      partialProps: { card: ['count', 'href'] },
    });
    expect(result.diagnostics).toEqual([]);
  });

  it('skips prop checks when the callee has no props contract', () => {
    const result = analyzeTemplate('{{> header}}', {
      partials: { header: '<header></header>' },
    });
    expect(result.diagnostics).toEqual([]);
  });

  it('matches browser parseTemplate structure for keyed each blocks', () => {
    const source = '<ul>{{#each todos$ key=id}}<li>{{ text }}</li>{{else}}<li>none</li>{{/each}}</ul>';
    const result = analyzeTemplate(source);
    expect(result.ok).toBe(true);
    const block = result.plan.root?.blocks[0];
    expect(block).toMatchObject({
      kind: 'each',
      path: [0, 0],
      source: { kind: 'path', segments: ['todos$'] },
      key: { kind: 'path', segments: ['id'], parentHops: 0 },
    });
    expect(block && 'empty' in block ? block.empty : undefined).toBeDefined();
  });
});

describe('precompileNode', () => {
  it('throws TemplateSyntaxError when analysis fails', () => {
    expect(() => precompileNode('<p>{{ broken + }}</p>')).toThrow(TemplateSyntaxError);
  });

  it('returns a fully compiled plan module', () => {
    const module = precompileNode('<p>{{ message }}</p>', { name: 'Greeting' });
    expect(module.plan.root?.compiled).toBe(true);
    expect(module.plan.root?.bindings).toHaveLength(1);
  });
});
