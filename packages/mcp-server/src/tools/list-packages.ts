import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const PACKAGE_CATALOG = `# @web-loom/* Package Catalog

| Package | Description | Key Exports | When to Use |
|---------|-------------|-------------|-------------|
| \`@web-loom/mvvm-core\` | Core MVVM library | \`BaseModel\`, \`RestfulApiModel\`, \`BaseViewModel\`, \`RestfulApiViewModel\`, \`Command\`, \`CompositeCommand\`, \`ObservableCollection\` | Always — the foundation of any web-loom app |
| \`@web-loom/query-core\` | Data fetching & caching | \`QueryCore\`, \`InMemoryCacheProvider\`, \`LocalStorageCacheProvider\`, \`IndexedDBCacheProvider\` | Need stale-while-revalidate caching, background refetch, or request deduplication |
| \`@web-loom/store-core\` | Minimal reactive state | \`createStore\`, \`PersistedStore\`, \`MemoryAdapter\`, \`LocalStorageAdapter\`, \`IndexedDBAdapter\` | UI-only state: theme, sidebar open/closed, active modal |
| \`@web-loom/ui-core\` | Headless UI behaviors | \`createDialogBehavior\`, \`createFormBehavior\`, \`createListSelection\`, \`createRovingFocus\`, \`createDragDropBehavior\`, \`createUndoRedoStack\`, \`createKeyboardShortcuts\` | Accessible, framework-agnostic UI primitives without styling |
| \`@web-loom/forms-core\` | Framework-agnostic forms | \`FormFactory\`, \`validateWithZod\`, \`AsyncValidator\`, \`FieldDependencyManager\`, \`FieldVisibilityManager\` | Complex forms with async validation, computed fields, or field dependencies |
| \`@web-loom/plugin-core\` | Plugin architecture | \`PluginRegistry\`, \`PluginManifest\`, \`PluginModule\`, \`PluginSDK\`, \`FrameworkAdapter\` | Extensible apps where third parties add routes, menu items, and widgets |
| \`@web-loom/event-bus-core\` | Pub-sub event bus | \`EventBus\` | Cross-feature communication without direct coupling between ViewModels |
| \`@web-loom/http-core\` | HTTP client utilities | Fetch wrappers, interceptors | Consistent HTTP error handling, auth headers, request/response transformations |
| \`@web-loom/router-core\` | Routing utilities | Route helpers, history abstraction | Framework-agnostic navigation and URL state |
| \`@web-loom/storage-core\` | Storage abstraction | \`LocalStorageAdapter\`, \`SessionStorageAdapter\` | Decoupled access to browser storage (testable) |
| \`@web-loom/i18n-core\` | Internationalization | \`I18n\`, translation helpers | Multi-language support |
| \`@web-loom/notifications-core\` | Notification system | \`NotificationService\` | Toast/alert notifications from ViewModels without direct DOM access |
| \`@web-loom/platform-core\` | Platform detection | Platform guards | Conditionally run code only on browser or server |
| \`@web-loom/media-core\` | Media player core | Player state machine, plugin hooks | Audio/video player with extensible plugin hooks |
| \`@web-loom/forms-react\` | React form adapter | \`useForm\`, React field components | Bind forms-core to React controlled inputs |
| \`@web-loom/forms-vue\` | Vue form adapter | \`useForm\` composable | Bind forms-core to Vue controlled inputs |
| \`@web-loom/ui-react\` | React UI adapters | React hooks for ui-core behaviors | Use headless ui-core behaviors as React hooks |
| \`@web-loom/media-react\` | React media player | \`useMediaPlayer\` | Audio/video player component in React |
| \`@web-loom/design-core\` | Design tokens & CSS | Theme token utilities | Consistent spacing, color, and typography tokens |

## Minimum Install for a New App

\`\`\`bash
npm install @web-loom/mvvm-core rxjs zod
\`\`\`

## Typical App Stack

\`\`\`bash
# Core MVVM
npm install @web-loom/mvvm-core @web-loom/query-core rxjs zod

# UI state
npm install @web-loom/store-core

# Forms (pick your framework adapter)
npm install @web-loom/forms-core @web-loom/forms-react

# Events
npm install @web-loom/event-bus-core
\`\`\`
`;

export function registerListPackagesTool(server: McpServer): void {
  server.registerTool(
    "list_packages",
    {
      description: "List all @web-loom/* packages with descriptions, key exports, and guidance on when to use each.",
    },
    async () => ({
      content: [{ type: "text" as const, text: PACKAGE_CATALOG }],
    })
  );
}
