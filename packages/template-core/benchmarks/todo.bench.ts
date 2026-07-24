/**
 * PRD §10 benchmark: initial render of the §8 todo-list template.
 * Target: < 50ms in a real browser. jsdom is not a real browser (its DOM
 * implementation is slower and less optimized than V8/Blink's), so this is
 * run via `npm run bench` for developers to eyeball against the target —
 * it is not asserted as a hard CI gate (see `src/performance.test.ts` for
 * the CI-safe, environment-tolerant smoke assertion).
 */
import { bench, describe } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { compile } from '../src/index.js';

const TODO_TEMPLATE = `
  <div>
    <h1>{{ title$ }}</h1>
    <ul>
      {{#each todos$ key=id}}
        <li class:done="done">{{ text }}</li>
      {{/each}}
    </ul>
  </div>
`;

describe('todo template', () => {
  bench('compile', () => {
    compile(TODO_TEMPLATE);
  });

  const template = compile(TODO_TEMPLATE);

  bench('initial render (10 items)', () => {
    const vm = {
      title$: signal('Todos'),
      todos$: signal(
        Array.from({ length: 10 }, (_, i) => ({ id: String(i), text: `Task ${i}`, done: i % 3 === 0 })),
      ),
    };
    const container = document.createElement('div');
    const view = template.mount(container, vm);
    view.dispose();
  });
});
