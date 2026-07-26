import { describe, expect, it } from 'vitest';
import { findCompileCalls } from './find-compile-calls.js';

const SPECIFIERS = ['@web-loom/template-core', '@web-loom/template-core/ssr'];

describe('findCompileCalls', () => {
  it('matches a no-substitution template literal source with no options', () => {
    const code = `
      import { compile } from '@web-loom/template-core';
      export const headerTemplate = compile(\`<h1>Hi</h1>\`);
    `;
    const { matches } = findCompileCalls(code, 'header.ts', SPECIFIERS);
    expect(matches).toHaveLength(1);
    expect(matches[0].templateSource).toBe('<h1>Hi</h1>');
    expect(matches[0].optionsText).toBeUndefined();
    expect(matches[0].specifier).toBe('@web-loom/template-core');
    expect(matches[0].name).toBe('headerTemplate');
  });

  it('matches a plain string literal source', () => {
    const code = `
      import { compile } from '@web-loom/template-core';
      export const t = compile("<p>hi</p>");
    `;
    const { matches } = findCompileCalls(code, 'x.ts', SPECIFIERS);
    expect(matches).toHaveLength(1);
    expect(matches[0].templateSource).toBe('<p>hi</p>');
  });

  it('captures a second argument verbatim, including cross-module identifiers', () => {
    const code = `
      import { compile } from '@web-loom/template-core';
      import { headerTemplate } from './header';
      export const appShellTemplate = compile(\`<div>{{> header}}</div>\`, {
        partials: { header: headerTemplate },
      });
    `;
    const { matches } = findCompileCalls(code, 'app-shell.ts', SPECIFIERS);
    expect(matches).toHaveLength(1);
    expect(matches[0].optionsText).toBe(`{
        partials: { header: headerTemplate },
      }`);
  });

  it('skips a call whose first argument is an identifier (cross-module source)', () => {
    const code = `
      import { compile } from '@web-loom/template-core';
      import { productCardTemplateSource } from './storefront-source';
      export const productCardTemplate = compile(productCardTemplateSource);
    `;
    const { matches } = findCompileCalls(code, 'storefront.ts', SPECIFIERS);
    expect(matches).toHaveLength(0);
  });

  it('skips a call whose first argument is a template literal with substitutions', () => {
    const code = `
      import { compile } from '@web-loom/template-core';
      const who = 'world';
      export const t = compile(\`<p>hi \${who}</p>\`);
    `;
    const { matches } = findCompileCalls(code, 'x.ts', SPECIFIERS);
    expect(matches).toHaveLength(0);
  });

  it('resolves the SSR specifier separately from the browser specifier', () => {
    const code = `
      import { compile } from '@web-loom/template-core/ssr';
      export const t = compile(\`<p>hi</p>\`);
    `;
    const { matches, specifiersNeedingImport } = findCompileCalls(code, 'entry-server.ts', SPECIFIERS);
    expect(matches).toHaveLength(1);
    expect(matches[0].specifier).toBe('@web-loom/template-core/ssr');
    expect(specifiersNeedingImport.has('@web-loom/template-core/ssr')).toBe(true);
    expect(specifiersNeedingImport.has('@web-loom/template-core')).toBe(false);
  });

  it('handles an aliased compile import', () => {
    const code = `
      import { compile as c } from '@web-loom/template-core';
      export const t = c(\`<p>hi</p>\`);
    `;
    const { matches } = findCompileCalls(code, 'x.ts', SPECIFIERS);
    expect(matches).toHaveLength(1);
    expect(matches[0].templateSource).toBe('<p>hi</p>');
  });

  it('does not flag a specifier as needing an import when fromPrecompiled is already imported', () => {
    const code = `
      import { compile, fromPrecompiled } from '@web-loom/template-core';
      export const t = compile(\`<p>hi</p>\`);
    `;
    const { specifiersNeedingImport } = findCompileCalls(code, 'x.ts', SPECIFIERS);
    expect(specifiersNeedingImport.size).toBe(0);
  });

  it('returns no matches when the file does not import compile from a target specifier', () => {
    const code = `
      function compile() { return null; }
      compile('not a template call');
    `;
    const { matches } = findCompileCalls(code, 'unrelated.ts', SPECIFIERS);
    expect(matches).toHaveLength(0);
  });
});
