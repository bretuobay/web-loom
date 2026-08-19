import type { LoomEmitMetadata } from './constants.js';

/**
 * Dev-mode virtual module: runtime `compile()` plus HMR accept so Vite can hot-reload template edits.
 */
export function emitLoomDevModule(source: string, meta: LoomEmitMetadata): string {
  const sourceLiteral = JSON.stringify(source);
  return [
    `import { compile } from '${meta.specifier}';`,
    `const source = ${sourceLiteral};`,
    `const template = compile(source, { name: ${JSON.stringify(meta.name)}, sourcePath: ${JSON.stringify(meta.sourcePath)}, dev: true });`,
    `export default template;`,
    `if (import.meta.hot) {`,
    `  import.meta.hot.accept();`,
    `}`,
    '',
  ].join('\n');
}
