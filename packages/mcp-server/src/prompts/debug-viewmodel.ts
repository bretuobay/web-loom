import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerDebugViewModelPrompt(server: McpServer): void {
  server.registerPrompt(
    "debug-viewmodel",
    {
      description: "Diagnose common issues in a web-loom ViewModel — missing dispose, leaked subscriptions, incorrect canExecute wiring, UI state in Model.",
      argsSchema: {
        code: z.string().describe("The ViewModel (and optionally its Model) source code to review"),
        symptom: z
          .string()
          .optional()
          .describe("Describe the problem you are seeing (e.g. 'memory leak', 'command never enables', 'data not updating')"),
      },
    },
    async ({ code, symptom }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              "Please review this web-loom ViewModel code for issues.",
              symptom ? `\n**Reported symptom**: ${symptom}\n` : "",
              "\n```typescript",
              code,
              "```",
              "\nCheck for these common anti-patterns in order:",
              "",
              "### 1. Dispose Pattern",
              "- Does the ViewModel call `super.dispose()` in its `dispose()` override?",
              "- Are all custom commands registered via `this.registerCommand()` (not stored as plain properties)?",
              "- Are manual signal subscriptions added via `this.addSubscription()` or otherwise torn down in `dispose()`?",
              "- Does the View/caller actually call `vm.dispose()` on unmount?",
              "",
              "### 2. Command Wiring",
              "- Is `canExecute$` correctly derived from a `ReadonlySignal<boolean>` or a function like `() => !this.isLoading$.get()`?",
              "- Does `canExecute$` read signal state synchronously so the command is enabled at start?",
              "- Are async operations inside `execute` wrapped in try/catch so `isExecuting$` resets on error?",
              "",
              "### 3. Model / Store Separation",
              "- Is business data (entities, loading state, errors) in the Model, not in Store?",
              "- Is UI-only state (which panel is open, current theme) in Store, not in the Model?",
              "",
              "### 4. Signal Contract",
              "- Are mutable signals kept private and exposed as `ReadonlySignal` values with `$` suffixes?",
              "- Are derived values created with `computed(() => ...)` and memoized as class properties, not recreated on each access?",
              "",
              "### 5. Lifecycle",
              "- Is the ViewModel instantiated once (not inside a render loop)?",
              "- Is `fetchCommand.execute()` called in the right lifecycle hook (after the View mounts, not during construction)?",
              "",
              "Report each finding as: **[ISSUE]** description → **[FIX]** corrected code snippet.",
            ].join("\n"),
          },
        },
      ],
    })
  );
}
