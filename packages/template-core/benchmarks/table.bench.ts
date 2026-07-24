/**
 * PRD §10 benchmark: keyed-table reconciliation, the workload that exercises
 * {{#each}}'s diff/move/patch path (loosely modeled on
 * js-framework-benchmark's "create 1,000 rows" / "partial update" / "swap
 * rows" cases). Target: single-signal update < 16ms in a real browser — see
 * `benchmarks/todo.bench.ts` for why this isn't a hard CI-asserted number.
 */
import { bench, describe } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { compile } from '../src/index.js';

interface Row {
  id: number;
  label: string;
}

function buildRows(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => ({ id: i, label: `row ${i}` }));
}

const TABLE_TEMPLATE = `
  <table>
    <tbody>
      {{#each rows$ key=id}}
        <tr><td>{{ id }}</td><td>{{ label }}</td></tr>
      {{/each}}
    </tbody>
  </table>
`;

describe('keyed table (1,000 rows)', () => {
  const template = compile(TABLE_TEMPLATE);

  bench('create 1,000 rows', () => {
    const rows$ = signal(buildRows(1000));
    const container = document.createElement('div');
    const view = template.mount(container, { rows$ });
    view.dispose();
  });

  bench('update every 10th row (partial update)', () => {
    const rows = buildRows(1000);
    const rows$ = signal(rows);
    const container = document.createElement('div');
    const view = template.mount(container, { rows$ });

    rows$.set(rows.map((row, i) => (i % 10 === 0 ? { ...row, label: `${row.label}!` } : row)));

    view.dispose();
  });

  bench('swap two rows', () => {
    const rows = buildRows(1000);
    const rows$ = signal(rows);
    const container = document.createElement('div');
    const view = template.mount(container, { rows$ });

    const swapped = rows.slice();
    const tmp = swapped[1]!;
    swapped[1] = swapped[998]!;
    swapped[998] = tmp;
    rows$.set(swapped);

    view.dispose();
  });
});
