import { describe, expect, it } from 'vitest';
import { findCompileCalls } from './find-compile-calls.js';

const SPECIFIERS = ['@web-loom/template-core', '@web-loom/template-core/ssr'];

describe('findCompileCalls', () => {
  it('records template literal content offsets', () => {
    const code = `
import { compile } from '@web-loom/template-core';
export const headerTemplate = compile(\`<h1>{{ title }}</h1>\`);
`;
    const { matches } = findCompileCalls(code, 'header.ts', SPECIFIERS);
    expect(matches).toHaveLength(1);
    const match = matches[0]!;
    expect(code.slice(match.templateContentStart, match.templateContentEnd)).toBe('<h1>{{ title }}</h1>');
  });

  it('records declareContext().compile() template literals', () => {
    const code = `
import { declareContext } from '@web-loom/template-core';
const page = declareContext();
export const headerTemplate = page.compile(\`<h1>{{ title }}</h1>\`);
`;
    const { matches } = findCompileCalls(code, 'header.ts', SPECIFIERS);
    expect(matches).toHaveLength(1);
    expect(code.slice(matches[0]!.templateContentStart, matches[0]!.templateContentEnd)).toBe('<h1>{{ title }}</h1>');
  });
});
