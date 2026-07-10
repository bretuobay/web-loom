import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const MVVM_ARCHITECTURE_DOC = `# Web-Loom MVVM Architecture Reference

## Layer Overview

\`\`\`
View (framework-specific)
  ↓ observes signals
ViewModel (framework-agnostic business logic)
  ↓ uses
Model (data & API layer)
  ↓ calls
Infrastructure (HTTP, Storage, i18n, etc.)
\`\`\`

Cross-cutting concerns (used across all layers):
- **EventBus** — cross-feature pub-sub
- **Store** — UI-only state (theme, sidebar, modal visibility)
- **Router** — navigation state
- **Notifications** — user feedback

**Rule**: Business data (entities, loading state, errors) lives in Models. UI-only state (which panel is open) lives in Store.

---

## BaseModel

\`\`\`typescript
import { BaseModel } from "@web-loom/mvvm-core";
import { z } from "zod";

const TodoSchema = z.object({ id: z.string(), text: z.string(), done: z.boolean() });
type TodoData = z.infer<typeof TodoSchema>;
const TodoListSchema = z.array(TodoSchema);

class TodoModel extends BaseModel<TodoData[], typeof TodoListSchema> {
  constructor() {
    super({ schema: TodoListSchema, initialData: [] });
  }

  async loadTodos(): Promise<void> {
    this.setLoading(true);
    try {
      const data = await fetch("/api/todos").then(r => r.json());
      this.setData(data);
    } catch (err) {
      this.setError(err);
    } finally {
      this.setLoading(false);
    }
  }
}
\`\`\`

Key signals: \`data$\`, \`isLoading$\`, \`error$\`, \`validationErrors$\`

---

## RestfulApiModel (preferred for CRUD)

\`\`\`typescript
import { RestfulApiModel } from "@web-loom/mvvm-core";

class TodoListModel extends RestfulApiModel<TodoData[], typeof TodoListSchema> {
  constructor() {
    super({
      baseUrl: "http://localhost:3000",
      endpoint: "/todos",
      fetcher: (url, opts) => fetch(url, opts).then(r => r.json()),
      schema: TodoListSchema,
      initialData: [],
    });
  }
}
// Built-in: fetch(), create(), update(), delete()
\`\`\`

---

## BaseViewModel

\`\`\`typescript
import { BaseViewModel, Command } from "@web-loom/mvvm-core";

class TodoViewModel extends BaseViewModel<TodoModel> {
  // Custom command
  public readonly loadCommand = this.registerCommand(
    new Command(async () => { await this.model.loadTodos(); })
  );

  constructor(model: TodoModel) {
    super(model);
  }

  public override dispose(): void {
    super.dispose(); // always call super
  }
}
\`\`\`

---

## RestfulApiViewModel (CRUD commands pre-built)

\`\`\`typescript
import { RestfulApiViewModel } from "@web-loom/mvvm-core";

class TodoListViewModel extends RestfulApiViewModel<TodoData[], typeof TodoListSchema> {
  // Pre-built: fetchCommand, createCommand, updateCommand, deleteCommand
  // Pre-built: selectedItem$, selectItem()

  constructor(model: TodoListModel) { super(model); }
  public override dispose(): void { super.dispose(); }
}
\`\`\`

---

## Command Pattern

\`\`\`typescript
import { Command } from "@web-loom/mvvm-core";

// Basic
const saveCommand = new Command<FormData, void>(
  async (data) => { await api.save(data); }
);

// With canExecute tied to loading state
const deleteCommand = new Command<string, void>(
  async (id) => { await api.delete(id); },
  () => !this.isLoading$.get() // disable while loading
);

// Usage
await saveCommand.execute(formData);
saveCommand.isExecuting$   // ReadonlySignal<boolean>
saveCommand.canExecute$    // ReadonlySignal<boolean>
saveCommand.executeError$  // ReadonlySignal<unknown>
\`\`\`

---

## CompositeCommand

\`\`\`typescript
import { CompositeCommand } from "@web-loom/mvvm-core";

const saveAll = new CompositeCommand({ executionMode: "parallel" });
saveAll.register(saveProfileCommand);
saveAll.register(saveSettingsCommand);

await saveAll.execute(); // runs both in parallel
saveAll.isExecuting$     // true while any child runs
\`\`\`

---

## Dispose Pattern (mandatory)

Every ViewModel MUST dispose to prevent memory leaks:

\`\`\`typescript
// React
useEffect(() => {
  vm.fetchCommand.execute();
  return () => vm.dispose(); // cleanup on unmount
}, [vm]);

// Vue
onUnmounted(() => vm.dispose());

// Angular
ngOnDestroy(): void { this.vm.dispose(); }
\`\`\`

---

## ObservableCollection

\`\`\`typescript
import { ObservableCollection } from "@web-loom/mvvm-core";

const items = new ObservableCollection<Todo>();
items.add({ id: "1", text: "Buy milk", done: false });
items.update("1", { done: true });
items.remove("1");

items.items$      // ReadonlySignal<Todo[]>
items.count$      // ReadonlySignal<number>
items.toArray()   // Todo[] snapshot
\`\`\`

---

## Package Selection Guide

| Need | Package |
|------|---------|
| CRUD entity with REST API | \`@web-loom/mvvm-core\` → RestfulApiModel + RestfulApiViewModel |
| Custom data fetching with caching | \`@web-loom/query-core\` → QueryCore |
| UI-only state (theme, panels) | \`@web-loom/store-core\` → createStore |
| Headless UI behaviors | \`@web-loom/ui-core\` → createDialogBehavior, createListSelection, etc. |
| Forms with validation | \`@web-loom/forms-core\` → FormFactory |
| Plugin system | \`@web-loom/plugin-core\` → PluginRegistry |
| Cross-feature events | \`@web-loom/event-bus-core\` |
| Routing | \`@web-loom/router-core\` |
| localStorage/sessionStorage | \`@web-loom/storage-core\` |

---

## Common Anti-Patterns to Avoid

1. **Calling dispose in the wrong place** — always dispose in the View's unmount hook, not in the ViewModel itself.
2. **Business data in Store** — Store is for UI state only (sidebar open, current theme). Entity data belongs in Models.
3. **Missing registerCommand** — custom commands MUST be registered via \`this.registerCommand()\` so they are disposed automatically.
4. **Observing without teardown** — use \`this.addSubscription()\` in ViewModels or keep teardown functions in Views so subscriptions are cleaned up on dispose/unmount.
5. **Creating ViewModel inside render** — instantiate ViewModels once (useState, @Injectable, module-level), not on every render cycle.
`;

export function registerArchitectureResource(server: McpServer): void {
  const uri = "web-loom://architecture/mvvm";
  server.registerResource(
    "architecture-mvvm",
    uri,
    {
      description: "MVVM layer reference — BaseModel, BaseViewModel, RestfulApiModel, Command, dispose pattern, package selection guide",
      mimeType: "text/markdown",
    },
    async (_uri) => ({
      contents: [{ uri, text: MVVM_ARCHITECTURE_DOC, mimeType: "text/markdown" }],
    })
  );
}
