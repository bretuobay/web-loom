/**
 * Correctness Property 12 ("surgical updates") and Requirement 11.4: a
 * Signal change must mutate only the DOM location(s) bound to it — not
 * re-render the template. Verified here via MutationObserver, which is a
 * real pass/fail assertion (unlike wall-clock timing, which the
 * `benchmarks/` scripts measure but don't hard-gate in CI — jsdom's DOM
 * implementation is not representative of a real browser's performance).
 */
import { describe, expect, it } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { compile } from './index.js';

function observeMutations(target: Node): { records: MutationRecord[]; disconnect: () => void } {
  const records: MutationRecord[] = [];
  const observer = new MutationObserver((muts) => records.push(...muts));
  observer.observe(target, { childList: true, subtree: true, characterData: true, attributes: true });
  return { records, disconnect: () => observer.disconnect() };
}

async function flushMutations(): Promise<void> {
  // MutationObserver delivers on a microtask; MutationRecords are only
  // populated after that microtask runs.
  await Promise.resolve();
}

describe('surgical updates: only the changed binding mutates the DOM', () => {
  it('changing one signal touches only its own text node, not sibling bindings', async () => {
    const a$ = signal('a0');
    const b$ = signal('b0');
    const c$ = signal('c0');
    const template = compile('<div><span id="a">{{ a$ }}</span><span id="b">{{ b$ }}</span><span id="c">{{ c$ }}</span></div>');
    const container = document.createElement('div');
    const view = template.mount(container, { a$, b$, c$ });

    const { records, disconnect } = observeMutations(container);
    b$.set('b1');
    await flushMutations();

    expect(container.querySelector('#a')!.textContent).toBe('a0');
    expect(container.querySelector('#b')!.textContent).toBe('b1');
    expect(container.querySelector('#c')!.textContent).toBe('c0');

    // Every mutation record must be scoped to span#b's text node — none to a/c.
    expect(records.length).toBeGreaterThan(0);
    const bSpan = container.querySelector('#b')!;
    for (const record of records) {
      const target = record.target;
      const withinB = target === bSpan || bSpan.contains(target);
      expect(withinB).toBe(true);
    }

    disconnect();
    view.dispose();
  });

  it('a keyed list update mutates only the changed row, not the whole list', async () => {
    const rows$ = signal([
      { id: 1, text: 'A' },
      { id: 2, text: 'B' },
      { id: 3, text: 'C' },
    ]);
    const template = compile('<ul>{{#each rows$ key=id}}<li>{{ text }}</li>{{/each}}</ul>');
    const container = document.createElement('div');
    const view = template.mount(container, { rows$ });
    const liB = Array.from(container.querySelectorAll('li'))[1]!;

    const { records, disconnect } = observeMutations(container);
    // Surgical single-row updates require preserving object identity for
    // unrelated rows (PRD §6.3): only row B's object reference changes here,
    // so only its instance re-resolves bindings. Replacing every row with a
    // freshly-literal object (even with unchanged text) would make every
    // instance's key survive with a *new* reference, correctly triggering a
    // full re-apply for all of them per Requirement 6.3 — that's not what
    // this test is verifying.
    rows$.set(rows$.peek().map((row) => (row.id === 2 ? { ...row, text: 'B2' } : row)));
    await flushMutations();

    expect(container.querySelectorAll('li')[1]).toBe(liB); // same node, patched in place
    expect(liB.textContent).toBe('B2');
    for (const record of records) {
      expect(record.target === liB || liB.contains(record.target)).toBe(true);
    }

    disconnect();
    view.dispose();
  });
});

describe('performance smoke test (generous, environment-tolerant — not the PRD §10 target itself)', () => {
  it('renders a 1,000-row keyed table well within a generous CI/jsdom budget', () => {
    const template = compile('<table><tbody>{{#each rows$ key=id}}<tr><td>{{ id }}</td><td>{{ label }}</td></tr>{{/each}}</tbody></table>');
    const rows$ = signal(Array.from({ length: 1000 }, (_, i) => ({ id: i, label: `row ${i}` })));
    const container = document.createElement('div');

    const start = performance.now();
    const view = template.mount(container, { rows$ });
    const elapsed = performance.now() - start;

    expect(container.querySelectorAll('tr').length).toBe(1000);
    // PRD §10 targets < 50ms in a real browser; jsdom is meaningfully
    // slower, so this only guards against catastrophic (e.g. O(n²)) regressions.
    expect(elapsed).toBeLessThan(2000);

    view.dispose();
  });
});
