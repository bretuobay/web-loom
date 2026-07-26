import { describe, expect, it } from 'vitest';
import { templateCorePrecompile } from './plugin.js';
import type { Plugin } from 'vite';

/** Minimal Rollup/Vite plugin-context stand-in — only `error` is used by this plugin. */
function makeContext() {
  return {
    error(message: string): never {
      throw new Error(message);
    },
  };
}

function runTransform(plugin: Plugin, code: string, id: string) {
  const transform = plugin.transform as (this: ReturnType<typeof makeContext>, code: string, id: string) => unknown;
  return transform.call(makeContext(), code, id) as { code: string; map: unknown } | null;
}

describe('templateCorePrecompile plugin.transform', () => {
  it('rewrites a compile(`literal`) call into fromPrecompiled(plan) and adds the import', () => {
    const plugin = templateCorePrecompile();
    const code = `
import { compile } from '@web-loom/template-core';
export const headerTemplate = compile(\`<h1>{{ title }}</h1>\`);
`;
    const result = runTransform(plugin, code, '/app/header.ts');
    expect(result).not.toBeNull();
    expect(result!.code).toContain('fromPrecompiled(');
    expect(result!.code).toContain('"version":2');
    expect(result!.code).toContain("import { fromPrecompiled } from '@web-loom/template-core';");
    expect(result!.code).not.toContain('compile(`<h1>');
    expect(result!.map).toBeTruthy();
  });

  it('preserves a second options argument verbatim, including cross-module references', () => {
    const plugin = templateCorePrecompile();
    const code = `
import { compile } from '@web-loom/template-core';
import { headerTemplate } from './header';
export const appShellTemplate = compile(\`<div>{{> header}}</div>\`, { partials: { header: headerTemplate } });
`;
    const result = runTransform(plugin, code, '/app/app-shell.ts');
    expect(result).not.toBeNull();
    expect(result!.code).toContain('{ partials: { header: headerTemplate } }');
  });

  it('targets the SSR specifier separately and imports fromPrecompiled from it', () => {
    const plugin = templateCorePrecompile();
    const code = `
import { compile } from '@web-loom/template-core/ssr';
export const t = compile(\`<p>{{ msg }}</p>\`);
`;
    const result = runTransform(plugin, code, '/app/entry-server.ts');
    expect(result).not.toBeNull();
    expect(result!.code).toContain("import { fromPrecompiled } from '@web-loom/template-core/ssr';");
  });

  it('leaves a non-literal (cross-module) source call untouched', () => {
    const plugin = templateCorePrecompile();
    const code = `
import { compile } from '@web-loom/template-core';
import { productCardTemplateSource } from './storefront-source';
export const productCardTemplate = compile(productCardTemplateSource);
`;
    const result = runTransform(plugin, code, '/app/storefront.ts');
    expect(result).toBeNull();
  });

  it('returns null for files excluded by default (test files, node_modules, fixtures)', () => {
    const plugin = templateCorePrecompile();
    const code = `
import { compile } from '@web-loom/template-core';
export const t = compile(\`<p>{{ msg }}</p>\`);
`;
    expect(runTransform(plugin, code, '/app/header.test.ts')).toBeNull();
    expect(runTransform(plugin, code, '/app/node_modules/pkg/x.ts')).toBeNull();
    expect(runTransform(plugin, code, '/app/src/__fixtures__/x.ts')).toBeNull();
  });

  it('is a no-op for files that never import compile from a target specifier', () => {
    const plugin = templateCorePrecompile();
    const code = `export const t = 1;`;
    expect(runTransform(plugin, code, '/app/unrelated.ts')).toBeNull();
  });

  it('only applies during build', () => {
    const plugin = templateCorePrecompile();
    expect(plugin.apply).toBe('build');
  });
});
