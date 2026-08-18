import { describe, expect, it } from 'vitest';
import { emitLoomBuildModule } from './emit-build.js';

describe('emitLoomBuildModule', () => {
  it('emits fromPrecompiled with an embedded plan', () => {
    const code = emitLoomBuildModule('<p>{{ title }}</p>', {
      name: 'Header',
      sourcePath: '/app/header.loom',
      specifier: '@web-loom/template-core',
    });

    expect(code).toContain("import { fromPrecompiled } from '@web-loom/template-core';");
    expect(code).toContain('export default fromPrecompiled(');
    expect(code).toMatch(/"version"\s*:\s*2/);
    expect(code).not.toContain('compile(');
  });

  it('throws when template analysis fails', () => {
    expect(() =>
      emitLoomBuildModule('{{#if a}}A', {
        name: 'Broken',
        sourcePath: '/app/broken.loom',
        specifier: '@web-loom/template-core',
      }),
    ).toThrow();
  });
});
