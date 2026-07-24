/**
 * MVVM integration proof (Requirement 10 / PRD §1): a real
 * `@web-loom/mvvm-core` ViewModel — the exact shape shared across every
 * demo app (`data$`/`isLoading$`/`error$`/Commands) — mounts through
 * `@web-loom/template-core` with zero adapter/bridge code. This is the
 * concrete demonstration that a signals-core ViewModel is genuinely
 * render-target-agnostic (PRD §1's lead goal), the same way `useSignal`
 * proves it for React, `fromLoomSignal` for Angular, etc.
 */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { RestfulApiModel, RestfulApiViewModel, type Fetcher } from '@web-loom/mvvm-core';
import { compile } from './index.js';

const TodoSchema = z.object({ id: z.string(), text: z.string() });
const TodoListSchema = z.array(TodoSchema);
type Todo = z.infer<typeof TodoSchema>;

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}

function makeViewModel(fetcher: Fetcher) {
  const model = new RestfulApiModel<Todo[], typeof TodoListSchema>({
    baseUrl: 'http://mock-api',
    endpoint: 'todos',
    fetcher,
    schema: TodoListSchema,
    initialData: [],
  });
  return new RestfulApiViewModel<Todo[], typeof TodoListSchema>(model);
}

const TEMPLATE_SOURCE = `
  <div>
    {{#if isLoading$}}
      <p class="status">Loading…</p>
    {{else if error$}}
      <p class="status error">{{ error$ }}</p>
    {{else}}
      <ul>
        {{#each data$ key=id}}
          <li>{{ text }}</li>
        {{else}}
          <li class="empty">No todos</li>
        {{/each}}
      </ul>
    {{/if}}
    <button on:click="fetchCommand.execute" :disabled="fetchCommand.isExecuting$">Reload</button>
  </div>
`;

describe('MVVM integration: zero-bridge-code mount', () => {
  it('renders the loading → success flow driven entirely by the ViewModel', async () => {
    const fetcher: Fetcher = async () =>
      jsonResponse([
        { id: '1', text: 'Milk' },
        { id: '2', text: 'Coffee' },
      ]);
    const vm = makeViewModel(fetcher);
    const template = compile(TEMPLATE_SOURCE);
    const container = document.createElement('div');
    const view = template.mount(container, vm); // <-- no useSignal, no fromLoomSignal, no manual observe() wiring

    expect(container.querySelector('.status')).toBeNull();
    expect(container.querySelector('.empty')?.textContent).toBe('No todos');

    const pending = vm.fetchCommand.execute();
    // Command.execute() is `async` and calls _isExecuting.set(true) (and the
    // model's setLoading(true)) synchronously before its first `await`, so
    // the loading state is observable immediately, with no need to await.
    expect(container.querySelector('.status')?.textContent).toBe('Loading…');
    expect(container.querySelector('button')!.hasAttribute('disabled')).toBe(true);

    await pending;

    expect(container.querySelector('.status')).toBeNull();
    const items = Array.from(container.querySelectorAll('li')).map((li) => li.textContent);
    expect(items).toEqual(['Milk', 'Coffee']);
    expect(container.querySelector('button')!.hasAttribute('disabled')).toBe(false);

    view.dispose();
    vm.dispose();
  });

  it('renders the loading → error flow driven entirely by the ViewModel', async () => {
    const fetcher: Fetcher = async () => {
      throw new Error('Network error: 500 Internal Server Error');
    };
    const vm = makeViewModel(fetcher);
    const template = compile(TEMPLATE_SOURCE);
    const container = document.createElement('div');
    const view = template.mount(container, vm);

    const pending = vm.fetchCommand.execute();
    expect(container.querySelector('.status')?.textContent).toBe('Loading…');

    await pending.catch(() => {}); // Command surfaces the rejection; the ViewModel's error$ is what we assert on

    // {{ error$ }} stringifies via String(value) — Error.prototype.toString() prefixes "Error: ".
    expect(container.querySelector('.status.error')?.textContent).toBe('Error: Network error: 500 Internal Server Error');
    expect(container.querySelector('ul')).toBeNull();

    view.dispose();
    vm.dispose();
  });
});
