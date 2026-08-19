import { describe, expect, it } from 'vitest';
import { emitLoomDevModule } from './emit-dev.js';

describe('emitLoomDevModule', () => {
  it('emits compile() with sourcePath metadata and HMR accept', () => {
    const code = emitLoomDevModule('<p>{{ title }}</p>', {
      name: 'Header',
      sourcePath: '/app/header.loom',
      specifier: '@web-loom/template-core',
    });

    expect(code).toContain("import { compile } from '@web-loom/template-core';");
    expect(code).toContain('compile(source, { name: "Header", sourcePath: "/app/header.loom", dev: true })');
    expect(code).toContain('export default template;');
    expect(code).toContain('import.meta.hot.accept()');
  });

  it('JSON-escapes template source with quotes and backslashes', () => {
    const code = emitLoomDevModule('<p>{{ msg }}</p>\n`test`', {
      name: 'Quoted',
      sourcePath: '/app/quoted.loom',
      specifier: '@web-loom/template-core',
    });

    expect(code).toContain('`test`');
    expect(code).toContain('\\n');
  });
});
