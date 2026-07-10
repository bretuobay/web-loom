import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

interface PackageRecommendation {
  package: string;
  reason: string;
  example?: string;
}

const USE_CASE_MAP: Array<{
  keywords: string[];
  recommendations: PackageRecommendation[];
}> = [
  {
    keywords: ["crud", "rest", "api", "fetch", "entity", "list", "model", "viewmodel", "mvvm"],
    recommendations: [
      {
        package: "@web-loom/mvvm-core",
        reason: "RestfulApiModel handles CRUD HTTP calls; RestfulApiViewModel provides fetchCommand, createCommand, updateCommand, deleteCommand out of the box.",
        example: "class UserModel extends RestfulApiModel<UserData[], typeof UserListSchema> { ... }",
      },
    ],
  },
  {
    keywords: ["cache", "stale", "revalidate", "refetch", "deduplicate", "background refresh"],
    recommendations: [
      {
        package: "@web-loom/query-core",
        reason: "QueryCore implements stale-while-revalidate caching, background refetch, and request deduplication without a framework.",
        example: "query.defineEndpoint<User[]>('users', fetcher, { refetchAfter: 30_000 });",
      },
    ],
  },
  {
    keywords: ["state", "ui state", "theme", "sidebar", "modal", "panel", "toggle", "global state"],
    recommendations: [
      {
        package: "@web-loom/store-core",
        reason: "createStore is designed for UI-only state (theme, sidebar, modals). Business data (entities) belongs in Models, not Store.",
        example: "const uiStore = createStore({ theme: 'light', sidebarOpen: true }, (setState) => ({ toggleTheme: () => setState(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' })) }));",
      },
    ],
  },
  {
    keywords: ["form", "input", "validation", "field", "submit", "dirty", "touched"],
    recommendations: [
      {
        package: "@web-loom/forms-core",
        reason: "FormFactory.create() handles field lifecycle, Zod validation, async validators, computed fields, and field visibility — framework-agnostic.",
      },
      {
        package: "@web-loom/forms-react",
        reason: "React adapter for forms-core; provides useForm hook for binding to controlled React inputs.",
      },
    ],
  },
  {
    keywords: ["dialog", "modal", "disclosure", "accordion", "keyboard", "focus", "drag", "drop", "undo", "redo", "list selection", "select", "shortcut", "hotkey"],
    recommendations: [
      {
        package: "@web-loom/ui-core",
        reason: "Headless behavior factories: createDialogBehavior, createDisclosureBehavior, createListSelection, createRovingFocus, createDragDropBehavior, createUndoRedoStack, createKeyboardShortcuts. No styling, no framework deps.",
      },
    ],
  },
  {
    keywords: ["plugin", "extension", "addon", "micro-frontend", "route", "menu", "widget", "third party"],
    recommendations: [
      {
        package: "@web-loom/plugin-core",
        reason: "PluginRegistry manages declarative plugin manifests with routes, menu items, and widgets. PluginModule provides init/mount/unmount lifecycle hooks.",
      },
    ],
  },
  {
    keywords: ["event", "publish", "subscribe", "pub sub", "cross feature", "decouple", "broadcast"],
    recommendations: [
      {
        package: "@web-loom/event-bus-core",
        reason: "EventBus enables cross-feature communication without direct ViewModel-to-ViewModel coupling.",
      },
    ],
  },
  {
    keywords: ["storage", "localstorage", "sessionstorage", "persist", "save to disk"],
    recommendations: [
      {
        package: "@web-loom/storage-core",
        reason: "Storage abstraction that decouples code from direct localStorage/sessionStorage calls — easier to test and swap.",
      },
      {
        package: "@web-loom/store-core",
        reason: "PersistedStore wraps createStore with automatic persistence via LocalStorageAdapter or IndexedDBAdapter.",
      },
    ],
  },
  {
    keywords: ["i18n", "internationalization", "translation", "locale", "language"],
    recommendations: [
      {
        package: "@web-loom/i18n-core",
        reason: "I18n utilities for managing translations and locale-sensitive formatting.",
      },
    ],
  },
  {
    keywords: ["notification", "toast", "alert", "banner", "message", "feedback"],
    recommendations: [
      {
        package: "@web-loom/notifications-core",
        reason: "NotificationService lets ViewModels trigger user feedback without coupling to DOM or framework.",
      },
    ],
  },
  {
    keywords: ["http", "interceptor", "auth header", "request", "response", "middleware"],
    recommendations: [
      {
        package: "@web-loom/http-core",
        reason: "HTTP client utilities with interceptor support for auth headers, error handling, and request/response transformation.",
      },
    ],
  },
  {
    keywords: ["router", "navigation", "route", "url", "history", "redirect"],
    recommendations: [
      {
        package: "@web-loom/router-core",
        reason: "Framework-agnostic routing utilities for managing navigation state inside ViewModels.",
      },
    ],
  },
  {
    keywords: ["media", "video", "audio", "player", "stream"],
    recommendations: [
      {
        package: "@web-loom/media-core",
        reason: "Media player core with a state machine and plugin extension points.",
      },
      {
        package: "@web-loom/media-react",
        reason: "React adapter for media-core — provides useMediaPlayer hook.",
      },
    ],
  },
  {
    keywords: ["design", "token", "theme", "color", "typography", "spacing", "css"],
    recommendations: [
      {
        package: "@web-loom/design-core",
        reason: "Design token system and CSS utilities for consistent theming across all web-loom apps.",
      },
    ],
  },
  {
    keywords: ["command", "action", "async action", "loading", "executing", "can execute"],
    recommendations: [
      {
        package: "@web-loom/mvvm-core",
        reason: "Command<TParam, TResult> encapsulates async actions with isExecuting$, canExecute$, and executeError$ signals. CompositeCommand orchestrates multiple commands.",
        example: "const saveCmd = new Command<FormData, void>(async (data) => { ... });",
      },
    ],
  },
  {
    keywords: ["signal", "computed", "observe", "reactivity", "bridge", "adapter"],
    recommendations: [
      {
        package: "@web-loom/signals-core",
        reason: "signals-core provides signal(), computed(), observe(), and ReadonlySignal for framework adapters and derived reactive state.",
        example: "const stop = observe(vm.data$, (data) => render(data));",
      },
    ],
  },
];

function findRecommendations(useCase: string): PackageRecommendation[] {
  const lowerCase = useCase.toLowerCase();
  const found = new Map<string, PackageRecommendation>();

  for (const entry of USE_CASE_MAP) {
    const matched = entry.keywords.some((kw) => lowerCase.includes(kw));
    if (matched) {
      for (const rec of entry.recommendations) {
        if (!found.has(rec.package)) {
          found.set(rec.package, rec);
        }
      }
    }
  }

  return Array.from(found.values());
}

export function registerSelectPackageTool(server: McpServer): void {
  server.registerTool(
    "select_package",
    {
      description: "Given a description of what you need to build, recommend the right @web-loom/* package(s) with reasoning.",
      inputSchema: {
        use_case: z
          .string()
          .describe(
            "Describe what you're trying to build or the problem you're solving (e.g. 'I need to fetch a list of users from a REST API and display them with loading state')"
          ),
      },
    },
    async ({ use_case }) => {
      const recommendations = findRecommendations(use_case);

      if (recommendations.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: [
                "No specific package match found for your use case. Here are general starting points:\n",
                "- **CRUD entity with REST API**: `@web-loom/mvvm-core` (RestfulApiModel + RestfulApiViewModel)",
                "- **UI state**: `@web-loom/store-core`",
                "- **Forms**: `@web-loom/forms-core`",
                "- **Headless UI behaviors**: `@web-loom/ui-core`",
                "\nRun `list_packages` to see the full catalog.",
              ].join("\n"),
            },
          ],
        };
      }

      const sections = recommendations.map((r) => {
        const lines = [`### \`${r.package}\``, r.reason];
        if (r.example) lines.push(`\`\`\`typescript\n${r.example}\n\`\`\``);
        return lines.join("\n");
      });

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `## Package Recommendations for: "${use_case}"\n`,
              sections.join("\n\n"),
              "\n---",
              "Run `list_packages` for the full catalog or `explain_pattern` for a pattern deep-dive.",
            ].join("\n"),
          },
        ],
      };
    }
  );
}
