/**
 * Phase 4 P1 benchmark: SSR `renderToString` cost for the same todo/table
 * fixtures used by the browser benches. A report, not a CI gate — see
 * `todo.bench.ts` for the general non-gating rationale, which applies here
 * too even though SSR runs under real Node (no jsdom involved).
 */
import { bench, describe } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { compile } from '../src/ssr/index.js';
import { TODO_TEMPLATE, TABLE_TEMPLATE, makeTodoViewModel, buildRows } from './fixtures.js';

describe('SSR renderToString', () => {
  const todo = compile(TODO_TEMPLATE);
  bench('todo (10 items)', () => {
    todo.renderToString(makeTodoViewModel(10));
  });

  const table = compile(TABLE_TEMPLATE);
  bench('table (1,000 rows)', () => {
    table.renderToString({ rows$: signal(buildRows(1000)) });
  });
});
