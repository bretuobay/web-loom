import { describe, expect, it } from 'vitest';
import { templateCorePrecompile } from './plugin.js';
import type { Plugin } from 'vite';

function makeContext() {
  const warnings: string[] = [];
  return {
    warnings,
    warn(message: string) {
      warnings.push(message);
    },
    error(message: string): never {
      throw new Error(message);
    },
  };
}

function resolveApply(plugin: Plugin, command: 'build' | 'serve'): boolean {
  const apply = plugin.apply;
  if (typeof apply === 'function') {
    return apply({} as never, { command, mode: command === 'build' ? 'production' : 'development' });
  }
  return Boolean(apply);
}

function runTransform(plugin: Plugin, code: string, id: string, command: 'build' | 'serve' = 'build') {
  const configResolved = plugin.configResolved as ((config: { command: string }) => void) | undefined;
  configResolved?.({ command });

  const transform = plugin.transform as unknown as (
    this: ReturnType<typeof makeContext>,
    code: string,
    id: string,
  ) => unknown;
  return transform.call(makeContext(), code, id) as { code: string; map: unknown } | null;
}

describe('templateCorePrecompile plugin.apply', () => {
  it('is active on build by default and inactive on serve', () => {
    const plugin = templateCorePrecompile();
    expect(resolveApply(plugin, 'build')).toBe(true);
    expect(resolveApply(plugin, 'serve')).toBe(false);
  });

  it('is active on serve when dev analyze is enabled', () => {
    const plugin = templateCorePrecompile({ dev: 'analyze' });
    expect(resolveApply(plugin, 'serve')).toBe(true);
    expect(resolveApply(plugin, 'build')).toBe(true);
  });

  it('is active on serve when dev precompile is enabled', () => {
    const plugin = templateCorePrecompile({ dev: 'precompile' });
    expect(resolveApply(plugin, 'serve')).toBe(true);
    expect(resolveApply(plugin, 'build')).toBe(true);
  });
});

describe('templateCorePrecompile plugin.transform — build', () => {
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

  it('fails the transform when a literal template contains an invalid expression', () => {
    const plugin = templateCorePrecompile();
    const code = `
import { compile } from '@web-loom/template-core';
export const broken = compile(\`<p>{{ count + 1 }}</p>\`);
`;
    expect(() => runTransform(plugin, code, '/app/broken.ts')).toThrow(/precompile|expression|INVALID_EXPRESSION/i);
  });
});

describe('templateCorePrecompile plugin.transform — dev analyze', () => {
  it('leaves source unchanged while reporting diagnostics', () => {
    const plugin = templateCorePrecompile({ dev: 'analyze' });
    const code = `
import { compile } from '@web-loom/template-core';
export const headerTemplate = compile(\`<h1>{{ title }}</h1>\`);
`;
    const ctx = makeContext();
    const configResolved = plugin.configResolved as ((config: { command: string }) => void) | undefined;
    configResolved?.({ command: 'serve' });
    const transform = plugin.transform as unknown as (this: typeof ctx, code: string, id: string) => unknown;
    const result = transform.call(ctx, code, '/app/header.ts');
    expect(result).toBeNull();
    expect(code).toContain('compile(`<h1>');
  });

  it('fails the transform for invalid expressions during dev analyze', () => {
    const plugin = templateCorePrecompile({ dev: 'analyze' });
    const code = `
import { compile } from '@web-loom/template-core';
export const broken = compile(\`<p>{{ count + 1 }}</p>\`);
`;
    expect(() => runTransform(plugin, code, '/app/broken.ts', 'serve')).toThrow(/INVALID_EXPRESSION/i);
  });
});

describe('templateCorePrecompile plugin.transform — dev precompile', () => {
  it('rewrites compile() to fromPrecompiled() during serve', () => {
    const plugin = templateCorePrecompile({ dev: 'precompile' });
    const code = `
import { compile } from '@web-loom/template-core';
export const headerTemplate = compile(\`<h1>{{ title }}</h1>\`);
`;
    const result = runTransform(plugin, code, '/app/header.ts', 'serve');
    expect(result).not.toBeNull();
    expect(result!.code).toContain('fromPrecompiled(');
    expect(result!.code).not.toContain('compile(`<h1>');
  });

  it('fails the transform when a literal template contains an invalid expression', () => {
    const plugin = templateCorePrecompile({ dev: 'precompile' });
    const code = `
import { compile } from '@web-loom/template-core';
export const broken = compile(\`<p>{{ count + 1 }}</p>\`);
`;
    expect(() => runTransform(plugin, code, '/app/broken.ts', 'serve')).toThrow(/precompile|expression|INVALID_EXPRESSION/i);
  });
});
