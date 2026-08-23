import { signal, type WritableSignal } from '@web-loom/signals-core';

export const TODO_TEMPLATE = `
  <div>
    <h1>{{ title$ }}</h1>
    <ul>
      {{#each todos$ key=id}}
        <li class:done="done">{{ text }}</li>
      {{/each}}
    </ul>
  </div>
`;

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export function makeTodoItems(count: number): TodoItem[] {
  return Array.from({ length: count }, (_, i) => ({ id: String(i), text: `Task ${i}`, done: i % 3 === 0 }));
}

export function makeTodoViewModel(count: number): {
  title$: WritableSignal<string>;
  todos$: WritableSignal<TodoItem[]>;
} {
  return { title$: signal('Todos'), todos$: signal(makeTodoItems(count)) };
}

export interface Row {
  id: number;
  label: string;
}

export function buildRows(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => ({ id: i, label: `row ${i}` }));
}

export const TABLE_TEMPLATE = `
  <table>
    <tbody>
      {{#each rows$ key=id}}
        <tr><td>{{ id }}</td><td>{{ label }}</td></tr>
      {{/each}}
    </tbody>
  </table>
`;
