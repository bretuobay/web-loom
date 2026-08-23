import { describe, expect, it } from 'vitest';
import { encodeTemplateLiteralContent, formatCompileCallsInSource } from './format-compile-calls.js';

describe('encodeTemplateLiteralContent', () => {
  it('escapes backticks, backslashes, and template interpolations', () => {
    expect(encodeTemplateLiteralContent('a\\b`c${d}')).toBe('a\\\\b\\`c\\${d}');
  });
});

describe('formatCompileCallsInSource', () => {
  it('formats direct compile() calls', () => {
    const source = [
      "import { compile } from '@web-loom/template-core';",
      'export const t = compile(`<div>{{#if ok}}<p>Yes</p>{{/if}}</div>`);',
      '',
    ].join('\n');

    const result = formatCompileCallsInSource(source, { filePath: 'page.ts' });
    expect(result.changed).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.source).toContain('{{#if ok}}');
    expect(result.source).toContain('<p>');
    expect(result.source).toContain('Yes');
    expect(result.source).not.toContain('{{#if ok}}<p>');
  });

  it('formats declareContext().compile() calls', () => {
    const source = [
      "import { declareContext } from '@web-loom/template-core';",
      'const page = declareContext();',
      'export const t = page.compile(`<section>{{> header}}</section>`);',
      '',
    ].join('\n');

    const result = formatCompileCallsInSource(source, { filePath: 'shell.ts' });
    expect(result.changed).toBe(true);
    expect(result.source).toContain('  {{> header}}');
  });

  it('is idempotent on a second format pass', () => {
    const source = [
      "import { compile } from '@web-loom/template-core';",
      'export const t = compile(`<div>{{#if ok}}<p>Yes</p>{{/if}}</div>`);',
      '',
    ].join('\n');

    const first = formatCompileCallsInSource(source, { filePath: 'page.ts' });
    expect(first.changed).toBe(true);

    const second = formatCompileCallsInSource(first.source, { filePath: 'page.ts' });
    expect(second.changed).toBe(false);
    expect(second.source).toBe(first.source);
  });

  it('returns linked diagnostics for invalid templates without mutating source', () => {
    const source = [
      "import { compile } from '@web-loom/template-core';",
      'export const t = compile(`{{#if a}}A`);',
      '',
    ].join('\n');

    const result = formatCompileCallsInSource(source, { filePath: 'broken.ts' });
    expect(result.changed).toBe(false);
    expect(result.source).toBe(source);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'INVALID_TEMPLATE',
      severity: 'error',
      filePath: 'broken.ts',
    });
  });

  it('no-ops files without template-core compile sites', () => {
    const source = 'export const x = 1;\n';
    const result = formatCompileCallsInSource(source, { filePath: 'plain.ts' });
    expect(result.changed).toBe(false);
    expect(result.source).toBe(source);
  });
});
