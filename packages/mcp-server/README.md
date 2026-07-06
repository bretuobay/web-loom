# @web-loom/mcp-server

MCP (Model Context Protocol) server for the web-loom framework. Gives AI assistants structured tools to scaffold `@web-loom/*` code, read package documentation, and guide common MVVM workflows.

## Installation

```bash
npm install -g @web-loom/mcp-server
```

Or run directly without installing:

```bash
npx @web-loom/mcp-server
```

## Setup with Claude Code

**Global** (available in all projects):
```bash
claude mcp add web-loom -- npx @web-loom/mcp-server
```

**Project-scoped** (creates `.mcp.json` in the repo root):
```bash
claude mcp add --scope project web-loom -- npx @web-loom/mcp-server
```

**From the monorepo** (after `npm run build`):
```bash
claude mcp add web-loom -- node packages/mcp-server/dist/index.js
```

## Capabilities

### Tools

#### Scaffolding

| Tool | What it generates |
|------|-------------------|
| `scaffold_model` | Model templates: REST class, REST config, simple state model, or cached query model |
| `scaffold_viewmodel` | ViewModel templates: REST CRUD class, reactive factory, command-focused class, or active searchable list |
| `scaffold_restful_feature` | Full feature: model + viewmodel + framework adapter |
| `scaffold_command` | Standalone `Command<P,R>` or `CompositeCommand` |
| `scaffold_plugin` | `PluginManifest` + `PluginModule` with lifecycle hooks |
| `scaffold_form` | `FormFactory` setup with Zod validation |

#### Knowledge

| Tool | What it returns |
|------|----------------|
| `explain_pattern` | Code example for a named pattern |
| `list_packages` | Catalog of all `@web-loom/*` packages |
| `select_package` | Package recommendation for a described use case |

**`scaffold_restful_feature`** is the most powerful tool — it returns all four files for a complete MVVM feature in one call:

```
scaffold_restful_feature({
  name: "Product",
  endpoint: "/products",
  fields: [
    { name: "title", type: "string" },
    { name: "price", type: "number" },
    { name: "inStock", type: "boolean", optional: true }
  ],
  framework: "react"   // "react" | "vue" | "vanilla" | "angular"
})
```

Returns `ProductModel.ts`, `ProductViewModel.ts`, and `useProduct.ts` with correct types, Zod schema, dispose pattern, and `useObservable` wiring.

`scaffold_model` supports a `style` option:

| Style | Use it for |
|-------|------------|
| `restful-class` | Default `RestfulApiModel` subclass with schema and reusable config |
| `restful-config` | Schema + config only, for `createReactiveViewModel` factory usage |
| `base-state` | Simple `BaseModel` with explicit `fetch`, `replaceAll`, and `clear` methods |
| `query-cache` | `BaseModel` backed by `QueryCore` caching and refresh behavior |

`scaffold_viewmodel` supports a matching `style` option:

| Style | Use it for |
|-------|------------|
| `restful-class` | Default `RestfulApiViewModel` subclass with built-in CRUD commands |
| `reactive-factory` | Minimal `createReactiveViewModel` setup backed by a model config export |
| `base-commands` | Domain-specific ViewModels with custom `Command` instances |
| `active-signals-list` | Simple searchable list screens that refresh when activated |

Example:

```
scaffold_viewmodel({
  name: "Catalog",
  modelClass: "CatalogModel",
  style: "active-signals-list",
  dataType: "CatalogProductDto[]",
  itemType: "CatalogProductDto"
})
```

`scaffold_restful_feature` accepts both `modelStyle` and `viewModelStyle`. If `modelStyle` is omitted, it chooses a compatible default:

| ViewModel style | Default model style |
|-----------------|---------------------|
| `restful-class` | `restful-class` |
| `reactive-factory` | `restful-config` |
| `base-commands` | `base-state` |
| `active-signals-list` | `query-cache` |

**`explain_pattern`** supports these pattern names:

`mvvm` · `command` · `observable` · `dispose-pattern` · `plugin` · `store` · `forms` · `query` · `composite-command`

### Resources

Resources expose live documentation that AI assistants can read as context.

| URI | Content |
|-----|---------|
| `web-loom://docs/mvvm-core` | `@web-loom/mvvm-core` README |
| `web-loom://docs/query-core` | `@web-loom/query-core` README |
| `web-loom://docs/store-core` | `@web-loom/store-core` README |
| `web-loom://docs/ui-core` | `@web-loom/ui-core` README |
| `web-loom://docs/forms-core` | `@web-loom/forms-core` README |
| `web-loom://docs/plugin-core` | `@web-loom/plugin-core` README |
| `web-loom://docs/event-bus-core` | `@web-loom/event-bus-core` README |
| `web-loom://docs/http-core` | `@web-loom/http-core` README |
| `web-loom://docs/router-core` | `@web-loom/router-core` README |
| `web-loom://docs/storage-core` | `@web-loom/storage-core` README |
| `web-loom://docs/i18n-core` | `@web-loom/i18n-core` README |
| `web-loom://docs/notifications-core` | `@web-loom/notifications-core` README |
| `web-loom://architecture/mvvm` | Embedded MVVM layer reference and anti-pattern guide |

README resources are read from the installed packages at request time, so they stay current with the installed version.

### Prompts

Guided prompt templates that instruct the AI through multi-step workflows.

| Prompt | Arguments | What it does |
|--------|-----------|--------------|
| `create-mvvm-feature` | `featureName`, `endpoint`, `fields`, `framework` | Walks through schema → model → viewmodel → adapter in order |
| `debug-viewmodel` | `code`, `symptom?` | Reviews a ViewModel for missing dispose, leaked subscriptions, incorrect canExecute wiring, UI state in Model |
| `migrate-to-web-loom` | `code`, `framework` | Maps existing component code to Model / ViewModel / View layers |

## Generated Code Conventions

All scaffolding tools enforce the patterns from the live codebase:

**Model** — choose the smallest style that fits. REST resources usually use `RestfulApiModel`; reactive factories can use config-only modules; custom workflows can use `BaseModel`; cached list screens can use `QueryCore`:
```typescript
const ProductSchema = z.object({ id: z.string(), title: z.string(), price: z.number() });
export type ProductData = z.infer<typeof ProductSchema>;
export const ProductListSchema = z.array(ProductSchema);

export class ProductModel extends RestfulApiModel<ProductListData, typeof ProductListSchema> {
  constructor(apiBase = "http://localhost:3000") {
    super({ baseUrl: apiBase, endpoint: "/products", fetcher, schema: ProductListSchema, initialData: [] });
  }
}
```

**ViewModel** — choose the smallest style that fits. REST resources usually extend `RestfulApiViewModel`; domain workflows can extend `BaseViewModel`; simple list screens can use signals:
```typescript
export class ProductViewModel extends RestfulApiViewModel<ProductListData, typeof ProductListSchema> {
  public readonly archiveCommand = this.registerCommand(
    new Command<string, void>(async (id) => { /* ... */ })
  );
  constructor(model: ProductModel) { super(model); }
  public override dispose(): void { super.dispose(); }
}
```

**React adapter** — `useObservable`, single `useState` for the VM instance, dispose on unmount:
```typescript
export function useProduct() {
  const [vm] = useState(() => new ProductViewModel(new ProductModel()));
  const data = useObservable(vm.data$, null);
  const isLoading = useObservable(vm.isLoading$, false);
  useEffect(() => { vm.fetchCommand.execute(); return () => vm.dispose(); }, [vm]);
  return { data, isLoading, vm };
}
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Type check
npm run check-types
```

The server uses Node.js stdio transport (stdin/stdout MCP protocol). It has no dependency on RxJS or any `@web-loom/*` runtime — it only generates code strings, keeping the bundle small.

## License

MIT
