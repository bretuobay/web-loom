import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerMigrateToWebLoomPrompt(server: McpServer): void {
  server.registerPrompt(
    "migrate-to-web-loom",
    {
      description: "Step-by-step migration guide from plain framework code (React useState/useEffect, Vue refs, vanilla JS) to the web-loom MVVM pattern.",
      argsSchema: {
        code: z.string().describe("The existing code to migrate (React component, Vue SFC, plain JS module, etc.)"),
        framework: z
          .enum(["react", "vue", "vanilla", "angular"])
          .describe("The source framework of the code"),
      },
    },
    async ({ code, framework }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              `Migrate this ${framework} code to the web-loom MVVM pattern.\n`,
              "```typescript",
              code,
              "```",
              "",
              "## Migration Steps",
              "",
              "### Step 1 — Identify the Data Layer",
              "Find all data fetching, state variables, and API calls. These become the **Model**:",
              "- `useState<User[]>([])` / `const users = ref([])` → `BaseModel.data$`",
              "- `setLoading(true)` / loading flags → `BaseModel.isLoading$`",
              "- `setError(e)` / error state → `BaseModel.error$`",
              "- `fetch('/api/users')` calls → move into `RestfulApiModel` or a custom `BaseModel` method",
              "",
              "### Step 2 — Identify the Business Logic Layer",
              "Find all event handlers, derived state, and orchestration. These become the **ViewModel**:",
              "- `onClick` handlers → `Command.execute()`",
              "- Loading guards (`if (isLoading) return`) → `canExecute$` on Commands",
              "- Derived values (`const total = items.reduce(...)`) → computed observables with `map`/`combineLatest`",
              "- Multi-step operations → `CompositeCommand`",
              "",
              "### Step 3 — Scaffold the Files",
              "Run `scaffold_restful_feature` if the code does CRUD, or use `scaffold_model` + `scaffold_viewmodel` separately.",
              "",
              "### Step 4 — Rewrite the View",
              "The View keeps only rendering logic:",
              framework === "react"
                ? "- Replace `useState` + `useEffect` with `useObservable(vm.data$, [])` and `useObservable(vm.isLoading$, false)`\n- Add `useEffect(() => { vm.fetchCommand.execute(); return () => vm.dispose(); }, [vm])`\n- Bind button `onClick` to `() => vm.yourCommand.execute(param)`\n- Disable buttons with `useObservable(vm.yourCommand.canExecute$, true)` negated"
                : framework === "vue"
                  ? "- Replace `ref`/`reactive` with subscriptions to `vm.data$`, `vm.isLoading$`\n- Call `vm.fetchCommand.execute()` in `onMounted`\n- Call `vm.dispose()` in `onUnmounted`\n- Bind `@click` to `() => vm.yourCommand.execute(param)`"
                  : framework === "angular"
                    ? "- Move data fetching to an `@Injectable` service holding the ViewModel\n- Use `async` pipe in templates with `vm.data$ | async`\n- Implement `OnDestroy` and call `vm.dispose()` in `ngOnDestroy`"
                    : "- Subscribe to observables manually: `vm.data$.subscribe(data => renderList(data))`\n- Call `vm.fetchCommand.execute()` on init\n- Store unsubscribe functions and call them + `vm.dispose()` on cleanup",
              "",
              "### Step 5 — Verify the Dispose Pattern",
              "Confirm the View's unmount hook calls `vm.dispose()`. This is the most commonly missed step.",
              "",
              "Now produce the migrated code for each layer (Model, ViewModel, View) based on the code above.",
            ].join("\n"),
          },
        },
      ],
    })
  );
}
