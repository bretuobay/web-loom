/**
 * Phase 4 P1 benchmark: execution cost of a precompiled plan (the
 * skip-the-parser path used by `fromPrecompiled()`), for both the browser
 * and SSR runtimes. A report, not a CI gate — see `todo.bench.ts`.
 */
import { bench, describe } from 'vitest';
import { precompile } from '../src/compiler/index.js';
import { precompileNode } from '../src/compiler/node.js';
import { fromPrecompiled as fromPrecompiledBrowser } from '../src/index.js';
import { fromPrecompiled as fromPrecompiledSsr } from '../src/ssr/index.js';
import { TODO_TEMPLATE, makeTodoViewModel } from './fixtures.js';

describe('precompiled plan execution', () => {
  const browserModule = precompile(TODO_TEMPLATE, { name: 'bench-browser' });
  const browserTemplate = fromPrecompiledBrowser(browserModule);
  bench('browser mount from precompiled plan (10 items)', () => {
    const container = document.createElement('div');
    const view = browserTemplate.mount(container, makeTodoViewModel(10));
    view.dispose();
  });

  const nodeModule = precompileNode(TODO_TEMPLATE, { name: 'bench-ssr' });
  const ssrTemplate = fromPrecompiledSsr(nodeModule);
  bench('SSR renderToString from precompiled plan (10 items)', () => {
    ssrTemplate.renderToString(makeTodoViewModel(10));
  });
});
