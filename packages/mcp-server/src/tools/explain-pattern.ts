import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const PATTERNS: Record<string, string> = {
  mvvm: `# MVVM Pattern in Web-Loom

MVVM separates concerns into three layers:

**Model** — owns data and API calls. Exposes \`data$\`, \`isLoading$\`, \`error$\` as RxJS observables.
**ViewModel** — business logic layer. Subscribes to Model observables, creates Commands, exposes derived state for the View.
**View** — framework-specific UI. Subscribes to ViewModel observables and binds Commands to events.

\`\`\`typescript
// Model: data layer
class ProductModel extends RestfulApiModel<ProductData[], typeof ProductListSchema> {
  constructor() { super({ baseUrl: "...", endpoint: "/products", fetcher, schema: ProductListSchema, initialData: [] }); }
}

// ViewModel: logic layer
class ProductViewModel extends RestfulApiViewModel<ProductData[], typeof ProductListSchema> {
  public readonly activateCommand = this.registerCommand(
    new Command<string, void>(async (id) => { /* custom logic */ })
  );
  constructor(model: ProductModel) { super(model); }
  public override dispose(): void { super.dispose(); }
}

// View (React): UI layer
function ProductList() {
  const [vm] = useState(() => new ProductViewModel(new ProductModel()));
  const products = useObservable(vm.data$, []);
  const loading = useObservable(vm.isLoading$, false);
  useEffect(() => { vm.fetchCommand.execute(); return () => vm.dispose(); }, [vm]);
  return loading ? <Spinner /> : products.map(p => <ProductCard key={p.id} product={p} />);
}
\`\`\``,

  command: `# Command Pattern in Web-Loom

Commands encapsulate async UI actions with automatic state tracking.

\`\`\`typescript
import { Command } from "@web-loom/mvvm-core";
import { map } from "rxjs";

// Basic command
const submitCommand = new Command<FormData, ApiResponse>(
  async (data) => {
    const result = await api.submit(data);
    return result;
  },
  // Optional: canExecute — Observable<boolean> or boolean
  this.isLoading$.pipe(map(loading => !loading))
);

// Bind to UI
submitCommand.isExecuting$   // show spinner
submitCommand.canExecute$    // disable button
submitCommand.executeError$  // show error
await submitCommand.execute(formData);
\`\`\`

Register inside ViewModels with \`this.registerCommand()\` — this auto-disposes on \`vm.dispose()\`.`,

  observable: `# RxJS Observable Pattern in Web-Loom

Web-Loom uses RxJS BehaviorSubjects internally and exposes read-only Observables to ViewModels and Views.

\`\`\`typescript
// In Models: BehaviorSubject (mutable)
private _count$ = new BehaviorSubject<number>(0);

// Exposed to outside: Observable (read-only)
public get count$(): Observable<number> { return this._count$.asObservable(); }

// In ViewModels: derive new observables
public readonly doubleCount$ = this.count$.pipe(map(n => n * 2));
public readonly isPositive$ = this.count$.pipe(map(n => n > 0));

// Combine observables
public readonly vm$ = combineLatest([this.data$, this.isLoading$]).pipe(
  map(([data, loading]) => ({ data, loading }))
);
\`\`\`

**Key rule**: Always unsubscribe. In ViewModels, use \`this.addSubscription()\` or \`takeUntil(this._destroy$)\`. The dispose pattern handles cleanup.`,

  "dispose-pattern": `# Dispose Pattern in Web-Loom

Every ViewModel holds resources (RxJS subscriptions, Command instances) that must be explicitly released.

\`\`\`typescript
class MyViewModel extends BaseViewModel<MyModel> {
  // registerCommand auto-disposes via super.dispose()
  public readonly saveCommand = this.registerCommand(new Command(...));

  // For manual subscriptions, use addSubscription()
  constructor(model: MyModel) {
    super(model);
    this.addSubscription(
      this.data$.pipe(
        filter(Boolean),
        tap(data => this.onDataLoaded(data))
      ).subscribe()
    );
  }

  public override dispose(): void {
    super.dispose(); // clears _subscriptions + _registeredCommands + signals _destroy$
  }
}

// In React:
useEffect(() => {
  return () => vm.dispose(); // run on unmount
}, [vm]);

// In Vue:
onUnmounted(() => vm.dispose());
\`\`\`

Forgetting \`dispose()\` causes memory leaks — subscriptions keep the ViewModel (and its data) alive indefinitely.`,

  plugin: `# Plugin Architecture in Web-Loom

\`\`\`typescript
import { PluginManifest, PluginModule, PluginRegistry, PluginSDK } from "@web-loom/plugin-core";

// 1. Define manifest (static metadata, declarative)
const analyticsManifest: PluginManifest = {
  id: "com.myapp.analytics",
  name: "Analytics",
  version: "1.0.0",
  entry: "@/plugins/analytics/index.js",
  routes: [{ path: "/analytics", component: () => import("./AnalyticsDashboard.js") }],
  menuItems: [{ id: "analytics-nav", label: "Analytics", path: "/analytics" }],
  widgets: [],
  dependencies: [],
};

// 2. Define module (runtime lifecycle)
const analyticsModule: PluginModule = {
  async init(sdk: PluginSDK) {
    sdk.events.subscribe("user:action", handler);
  },
  async mount(sdk: PluginSDK) {
    sdk.ui.render(AnalyticsDashboard, document.getElementById("plugin-root")!);
  },
  async unmount() {
    // cleanup DOM, subscriptions
  },
};

// 3. Register in host
const registry = new PluginRegistry();
registry.register({ ...analyticsManifest, module: analyticsModule });
\`\`\``,

  store: `# Store Pattern in Web-Loom

\`@web-loom/store-core\` is for **UI-only state** (theme, sidebar visibility, active modal). Business data belongs in Models.

\`\`\`typescript
import { createStore } from "@web-loom/store-core";

interface UIState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
  activeModal: string | null;
}

const uiStore = createStore<UIState, UIActions>(
  { theme: "light", sidebarOpen: true, activeModal: null },
  (setState) => ({
    toggleTheme: () =>
      setState((s) => ({ ...s, theme: s.theme === "light" ? "dark" : "light" })),
    setSidebar: (open: boolean) =>
      setState((s) => ({ ...s, sidebarOpen: open })),
    openModal: (id: string) =>
      setState((s) => ({ ...s, activeModal: id })),
    closeModal: () =>
      setState((s) => ({ ...s, activeModal: null })),
  })
);

uiStore.getState();
uiStore.actions.toggleTheme();
uiStore.subscribe((state) => console.log(state));
\`\`\``,

  forms: `# Forms Pattern in Web-Loom

\`\`\`typescript
import { FormFactory, validateWithZod } from "@web-loom/forms-core";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginForm = FormFactory.create<{ email: string; password: string }>({
  onSubmit: async (values) => {
    await authService.login(values);
  },
  validate: (values) => {
    const r = validateWithZod(LoginSchema, values);
    return r.success ? {} : r.errors ?? {};
  },
});

loginForm.registerField("email", { initialValue: "" });
loginForm.registerField("password", { initialValue: "" });

// Subscribe to state
loginForm.subscribe((state) => {
  console.log(state.isValid, state.isSubmitting);
});

// On input change
loginForm.setFieldValue("email", e.target.value);

// On form submit
await loginForm.submit();
\`\`\``,

  query: `# Query Pattern in Web-Loom

\`@web-loom/query-core\` provides stale-while-revalidate caching without a framework.

\`\`\`typescript
import { QueryCore, InMemoryCacheProvider } from "@web-loom/query-core";

const query = new QueryCore({
  cacheProvider: new InMemoryCacheProvider(),
  defaultRefetchAfter: 60_000, // 1 minute
});

// Define endpoint
query.defineEndpoint<Product[]>("products", () =>
  fetch("/api/products").then(r => r.json()),
  { refetchAfter: 30_000 }
);

// Subscribe to state changes
query.subscribe<Product[]>("products", (state) => {
  // state.data, state.isLoading, state.isError, state.error
});

// Manual refetch
await query.refetch("products");

// Invalidate cache
query.invalidate("products");
\`\`\`

Prefer \`@web-loom/query-core\` when you need caching and background refetching without the full MVVM stack. Use it inside Models for the data fetching layer.`,

  "composite-command": `# CompositeCommand in Web-Loom

CompositeCommand orchestrates multiple commands as one unit.

\`\`\`typescript
import { CompositeCommand } from "@web-loom/mvvm-core";

// Parallel: both run at the same time
const saveAll = new CompositeCommand({ executionMode: "parallel" });
saveAll.register(saveProfileCommand);
saveAll.register(saveNotificationsCommand);

// Sequential: runs in registration order
const onboarding = new CompositeCommand({ executionMode: "sequential" });
onboarding.register(createAccountCommand);
onboarding.register(sendWelcomeEmailCommand);
onboarding.register(setupDefaultsCommand);

await saveAll.execute();  // both profile + notifications save in parallel
onboarding.isExecuting$   // Observable<boolean>
onboarding.canExecute$    // true only when ALL children can execute
\`\`\`

Register composite commands in ViewModels with \`this.registerCommand(saveAll)\` for automatic disposal.`,
};

export function registerExplainPatternTool(server: McpServer): void {
  server.registerTool(
    "explain_pattern",
    {
      description: "Get an explanation and code example for a specific web-loom architectural pattern.",
      inputSchema: {
        pattern: z
          .enum([
            "mvvm",
            "command",
            "observable",
            "dispose-pattern",
            "plugin",
            "store",
            "forms",
            "query",
            "composite-command",
          ])
          .describe("The pattern to explain"),
      },
    },
    async ({ pattern }) => {
      const content = PATTERNS[pattern];
      return {
        content: [{ type: "text" as const, text: content ?? `Unknown pattern: ${pattern}` }],
      };
    }
  );
}
