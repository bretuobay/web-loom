# Kibana Plugin Architecture Analysis

## 1. High-Level Summary

### Architecture Type
**Manifest-Based Dependency Injection Plugin Architecture**

Kibana implements a sophisticated plugin system combining:
- **Manifest-based discovery** via `kibana.json` configuration files
- **Dependency injection** for core services and plugin contracts
- **Lifecycle-driven orchestration** with setup/start/stop phases
- **Topological sorting** (Kahn's Algorithm) for dependency resolution
- **Dual-environment support** (server-side Node.js + client-side browser)

### Problem Solved
The plugin architecture addresses several critical needs:
- **Modularity**: Allows independent development and maintenance of features
- **Extensibility**: Third-party plugins can extend core functionality
- **Dependency Management**: Explicit declaration and resolution of plugin dependencies
- **Configuration Isolation**: Each plugin manages its own configuration namespace
- **Lifecycle Coordination**: Ensures plugins initialize in correct dependency order
- **Code Splitting**: Separates server and client code with shared contracts
- **Team Ownership**: Clear boundaries for feature teams to work independently
- **Version Compatibility**: Prevents incompatible plugins from loading

---

## 2. Plugin Discovery & Loading

### Discovery Mechanisms

#### File-Based Discovery
**Location**: `packages/core/plugins/core-plugins-server-internal/src/discovery/plugins_discovery.ts`

The discovery process scans multiple plugin search paths:
```typescript
export async function discover(
  config: PluginsServiceDiscoverySetup,
  coreContext: CoreContext,
  instanceInfo: InstanceInfo
) {
  const discoveries$ = merge(
    // Scan configured plugin search paths
    from(config.additionalPluginPaths),
    // Scan default plugin directories
    scanPluginSearchPaths(pluginSearchPaths, log)
  );
}
```

**Discovery Strategy**:
1. **Directory Scanning**: Traverses plugin directories recursively
2. **Manifest Detection**: Looks for `kibana.json` or `kibana.jsonc` files
3. **Package Discovery**: Integrates with Kibana's package system for built-in plugins
4. **Stream-Based**: Uses RxJS observables for async discovery with error handling

**File**: `packages/core/plugins/core-plugins-server-internal/src/discovery/scan_plugin_search_paths.ts`

#### Manifest Parsing
**Location**: `packages/core/plugins/core-plugins-server-internal/src/discovery/plugin_manifest_parser.ts:68`

```typescript
export async function parseManifest(
  pluginPath: string,
  packageInfo: PackageInfo
): Promise<PluginManifest> {
  const manifestPath = resolve(pluginPath, 'kibana.json');

  // Read and parse JSON
  manifestContent = await fsReadFileAsync(manifestPath);
  manifest = JSON.parse(manifestContent.toString());

  // Validate required fields: id, version, owner
  // Validate version compatibility
  // Return normalized manifest
}
```

**Validation Rules**:
- Plugin `id` must be camelCase with no dots
- Must have `version` and `owner.name` properties
- Either `server` or `ui` (or both) must be `true`
- `kibanaVersion` must match current Kibana version (or "kibana" for always compatible)
- Unknown manifest fields trigger errors

### Loading Mechanism

#### Server-Side Loading
**Location**: `packages/core/plugins/core-plugins-server-internal/src/plugin.ts:179`

```typescript
private async createPluginInstance() {
  // Dynamic require of plugin's server directory
  const pluginDefinition = require(join(this.path, 'server'));

  if (!('plugin' in pluginDefinition)) {
    throw new Error(`Plugin does not export "plugin" definition`);
  }

  // Call initializer function
  const { plugin: initializer } = pluginDefinition;
  const instance = await initializer(this.initializerContext);

  // Validate instance has setup method
  if (typeof instance.setup !== 'function') {
    throw new Error(`Plugin does not define "setup" function`);
  }

  return instance;
}
```

**Entry Point Convention**: `{pluginPath}/server/index.ts` must export:
- `plugin` function (PluginInitializer)
- Optional `config` object (PluginConfigDescriptor)

#### Client-Side Loading
**Location**: `packages/core/plugins/core-plugins-browser-internal/src/plugin_reader.ts`

Browser plugins are loaded via dynamic imports:
- Plugin metadata sent from server to client
- Plugin bundles loaded on-demand via webpack
- Same lifecycle pattern as server (setup/start/stop)

**Entry Point Convention**: `{pluginPath}/public/index.ts` must export:
- `plugin` function returning plugin instance

---

## 3. Plugin Registration

### Registry Object
**Location**: `packages/core/plugins/core-plugins-server-internal/src/plugins_system.ts:31`

```typescript
export class PluginsSystem<T extends PluginType> {
  private readonly plugins = new Map<PluginName, PluginWrapper>();
  private readonly satupPlugins: PluginName[] = [];

  public addPlugin(plugin: PluginWrapper) {
    if (plugin.manifest.type !== this.type) {
      throw new Error('Cannot add plugin with wrong type');
    }
    this.plugins.set(plugin.name, plugin);
  }
}
```

The `PluginsSystem` class:
- Maintains a Map of plugin name → PluginWrapper
- Enforces type consistency (preboot vs standard plugins)
- Tracks which plugins have completed setup
- Provides topological sorting for dependency order

### Plugin Wrapper
**Location**: `packages/core/plugins/core-plugins-server-internal/src/plugin.ts:36`

Each discovered plugin is wrapped in a `PluginWrapper` class:
```typescript
export class PluginWrapper {
  public readonly manifest: PluginManifest;
  public readonly opaqueId: PluginOpaqueId;
  public readonly source: 'oss' | 'x-pack' | 'external';

  private instance?: Plugin | PrebootPlugin | AsyncPlugin;

  public async init() {
    this.instance = await this.createPluginInstance();
  }

  public setup(setupContext, plugins) { /* ... */ }
  public start(startContext, plugins) { /* ... */ }
  public async stop() { /* ... */ }
}
```

**Source Classification**:
- `oss`: Plugins in `src/plugins/`
- `x-pack`: Plugins in `x-pack/plugins/`
- `external`: All other locations

### Registration Flow

1. **Discovery**: Scan directories for `kibana.json` files
2. **Validation**: Parse and validate manifests
3. **Dependency Check**: Verify required plugins exist
4. **Wrapper Creation**: Create PluginWrapper for each valid plugin
5. **System Addition**: Add to PluginsSystem via `addPlugin()`
6. **Initialization**: Call `init()` to create plugin instances
7. **Lifecycle Execution**: Run setup → start → stop as needed

---

## 4. Plugin Interface / Contract

### Required Methods

#### Standard Plugin Interface
**Location**: `packages/core/plugins/core-plugins-server/src/types.ts:290`

```typescript
export interface Plugin<
  TSetup = void,
  TStart = void,
  TPluginsSetup extends object = object,
  TPluginsStart extends object = object
> {
  setup(core: CoreSetup, plugins: TPluginsSetup): TSetup;
  start(core: CoreStart, plugins: TPluginsStart): TStart;
  stop?(): MaybePromise<void>;
}
```

**Required**:
- `setup()`: Initialize plugin, register resources, return setup contract
- `start()`: Activate plugin services, return start contract

**Optional**:
- `stop()`: Cleanup resources, close connections

#### Preboot Plugin Interface
**Location**: `packages/core/plugins/core-plugins-server/src/types.ts:279`

```typescript
export interface PrebootPlugin<TSetup = void, TPluginsSetup extends object = object> {
  setup(core: CorePreboot, plugins: TPluginsSetup): TSetup;
  stop?(): void;
}
```

Preboot plugins:
- Only have `setup` phase (no `start`)
- Execute before standard plugins
- Used for critical initialization tasks

### Manifest Schema

**Location**: `packages/core/plugins/core-plugins-server/src/types.ts:161`

```typescript
export interface PluginManifest {
  // REQUIRED
  readonly id: PluginName;              // camelCase, no dots
  readonly version: string;              // plugin version
  readonly owner: {
    readonly name: string;               // team name
    readonly githubTeam?: string;        // GitHub team
  };

  // CONFIGURATION
  readonly kibanaVersion: string;        // compatible version or "kibana"
  readonly type: PluginType;            // "standard" | "preboot"
  readonly configPath: ConfigPath;       // defaults to snake_case(id)

  // CAPABILITIES
  readonly server: boolean;              // has server-side code
  readonly ui: boolean;                  // has client-side code

  // DEPENDENCIES
  readonly requiredPlugins: readonly PluginName[];
  readonly optionalPlugins: readonly PluginName[];
  readonly requiredBundles: readonly string[];
  readonly runtimePluginDependencies: readonly string[];

  // OPTIONAL
  readonly description?: string;
  readonly enabledOnAnonymousPages?: boolean;
  readonly extraPublicDirs?: string[];
  readonly serviceFolders?: readonly string[];
}
```

### Example Manifest

**Location**: `src/plugins/data/kibana.jsonc`

```json
{
  "plugin": {
    "id": "data",
    "server": true,
    "browser": true,
    "requiredPlugins": [
      "bfetch",
      "expressions",
      "uiActions",
      "fieldFormats",
      "dataViews"
    ],
    "optionalPlugins": [
      "usageCollection"
    ],
    "requiredBundles": [
      "kibanaUtils",
      "kibanaReact",
      "inspector"
    ]
  }
}
```

### Configuration Descriptor

**Location**: `packages/core/plugins/core-plugins-server/src/types.ts:99`

Exported from `server/index.ts`:
```typescript
export const config: PluginConfigDescriptor<ConfigType> = {
  schema: configSchema,                    // Validation schema
  exposeToBrowser: {                       // Config exposed to client
    prop: true
  },
  deprecations: ({ rename, unused }) => [  // Config deprecations
    rename('oldKey', 'newKey')
  ],
  dynamicConfig: {                         // Runtime-updatable config
    prop: true
  },
  exposeToUsage: {                        // Telemetry reporting
    prop: true
  }
};
```

---

## 5. Plugin Lifecycle

### Lifecycle Phases

#### 1. Discovery Phase
**When**: During Kibana bootstrap
**Where**: `PluginsService.discover()`

Actions:
- Scan plugin directories
- Parse `kibana.json` manifests
- Validate plugin metadata
- Check version compatibility
- Determine plugin enablement

#### 2. Initialization Phase
**When**: Before lifecycle execution
**Where**: `PluginWrapper.init()` at `plugin.ts:90`

Actions:
- Topological sort based on dependencies
- Register configuration schemas
- Create PluginInitializerContext
- Load plugin code via `require()`
- Call plugin initializer function
- Validate plugin instance

```typescript
public async init() {
  this.instance = await this.createPluginInstance();
  // Validates: instance exists, has setup method
}
```

#### 3. Setup Phase
**When**: After initialization, before start
**Where**: `PluginsSystem.setupPlugins()` at `plugins_system.ts:90`

**Timeout**: 10 seconds per plugin

```typescript
public async setupPlugins(deps) {
  const contracts = new Map<PluginName, unknown>();

  // Iterate in topological order
  for (const [pluginName, plugin] of sortedPlugins) {
    const pluginDepContracts = collectDependencyContracts(plugin);
    const pluginSetupContext = createPluginSetupContext({ deps, plugin });

    // Call plugin.setup() with timeout
    const contract = await withTimeout({
      promise: plugin.setup(pluginSetupContext, pluginDepContracts),
      timeoutMs: 10 * 1000
    });

    contracts.set(pluginName, contract);
  }

  return contracts;
}
```

**Setup Context (Server)**:
- `core.analytics`, `core.capabilities`, `core.elasticsearch`
- `core.http`, `core.savedObjects`, `core.uiSettings`
- `core.logging`, `core.metrics`, `core.deprecations`
- `core.getStartServices()` for accessing start-phase services

**What Plugins Do**:
- Register HTTP routes
- Register saved object types
- Register UI settings
- Set up internal services
- Return setup contract for dependent plugins

#### 4. Start Phase
**When**: After all plugins complete setup
**Where**: `PluginsSystem.startPlugins()` at `plugins_system.ts:171`

**Timeout**: 10 seconds per plugin

**Important**: Preboot plugins are stopped before standard plugins start

```typescript
public async startPlugins(deps: PluginsServiceStartDeps) {
  const contracts = new Map<PluginName, unknown>();

  for (const pluginName of this.satupPlugins) {
    const plugin = this.plugins.get(pluginName)!;
    const pluginDepContracts = collectDependencyContracts(plugin);

    const contract = await withTimeout({
      promise: plugin.start(createPluginStartContext(...), pluginDepContracts),
      timeoutMs: 10 * 1000
    });

    contracts.set(pluginName, contract);
  }

  return contracts;
}
```

**Start Context**:
- Additional services not available during setup
- All plugin dependencies have completed setup
- Full core services available

**What Plugins Do**:
- Activate background services
- Start task scheduling
- Begin processing requests
- Return start contract for dependent plugins

#### 5. Stop Phase
**When**: Kibana shutdown
**Where**: `PluginsSystem.stopPlugins()` at `plugins_system.ts:232`

**Timeout**: 15 seconds per plugin

**Order**: Reverse topological order (dependents stop before dependencies)

```typescript
public async stopPlugins() {
  const reverseDependencyMap = buildReverseDependencyMap(this.plugins);
  const pluginStopPromiseMap = new Map<PluginName, Promise<void>>();

  // Iterate in reverse order
  for (let i = this.satupPlugins.length - 1; i >= 0; i--) {
    const pluginName = this.satupPlugins[i];
    const plugin = this.plugins.get(pluginName)!;

    // Wait for all dependents to stop first
    const dependantPromises = reverseDependencyMap
      .get(pluginName)!
      .map(dep => pluginStopPromiseMap.get(dep)!);

    const pluginStopPromise = Promise.all(dependantPromises).then(async () => {
      await withTimeout({
        promise: plugin.stop(),
        timeoutMs: 15 * 1000
      });
    });

    pluginStopPromiseMap.set(pluginName, pluginStopPromise);
  }

  await Promise.allSettled(pluginStopPromiseMap.values());
}
```

**Error Handling**: Failures logged but don't prevent other plugins from stopping

### Dependency Resolution

**Algorithm**: Kahn's Algorithm for topological sorting
**Location**: `plugins_system.ts:320`

```typescript
const getTopologicallySortedPluginNames = (plugins) => {
  const pluginsDependenciesGraph = new Map(/* build dependency graph */);

  // Find start nodes (no dependencies)
  const pluginsWithAllDependenciesSorted = [...pluginsDependenciesGraph.keys()]
    .filter(pluginName => pluginsDependenciesGraph.get(pluginName)!.size === 0);

  const sortedPluginNames = new Set<PluginName>();
  while (pluginsWithAllDependenciesSorted.length > 0) {
    const sortedPluginName = pluginsWithAllDependenciesSorted.pop()!;
    sortedPluginNames.add(sortedPluginName);

    // Remove from dependents' dependency lists
    for (const [pluginName, dependencies] of pluginsDependenciesGraph) {
      if (dependencies.delete(sortedPluginName) && dependencies.size === 0) {
        pluginsWithAllDependenciesSorted.push(pluginName);
      }
    }
  }

  // If graph not empty, circular dependencies exist
  if (pluginsDependenciesGraph.size > 0) {
    throw new Error('Cyclic or missing dependencies detected');
  }

  return sortedPluginNames;
};
```

---

## 6. Extension Points

### Core Services (Server-Side)

#### HTTP Service
```typescript
const router = core.http.createRouter();
router.get({
  path: '/api/my-plugin/data',
  validate: { query: schema.object({ id: schema.string() }) }
}, async (context, request, response) => {
  return response.ok({ body: data });
});
```

**File**: `packages/core/http/core-http-server/src/router/router.ts`

#### Saved Objects Service
```typescript
core.savedObjects.registerType({
  name: 'my-type',
  hidden: false,
  namespaceType: 'single',
  mappings: {
    properties: {
      title: { type: 'text' }
    }
  },
  migrations: {
    '8.0.0': migrateFn
  }
});
```

**File**: `packages/core/saved-objects/core-saved-objects-server/src/saved_objects_service.ts`

#### UI Settings Service
```typescript
core.uiSettings.register({
  'myPlugin:setting': {
    name: 'My Setting',
    value: 'default',
    description: 'Description',
    category: ['general'],
    schema: schema.string()
  }
});
```

**File**: `packages/core/ui-settings/core-ui-settings-server/src/ui_settings_service.ts`

#### Elasticsearch Service
```typescript
const client = core.elasticsearch.client.asCurrentUser;
const result = await client.search({
  index: 'my-index',
  body: { query: { match_all: {} } }
});
```

**File**: `packages/core/elasticsearch/core-elasticsearch-server/src/elasticsearch_service.ts`

#### Capabilities Service
```typescript
core.capabilities.registerProvider(() => ({
  myPlugin: {
    show: true,
    save: true,
    delete: false
  }
}));
```

#### Deprecations Service
```typescript
core.deprecations.registerDeprecations({
  getDeprecations: async (context) => [
    {
      title: 'Deprecated setting',
      message: 'Setting X is deprecated',
      level: 'warning',
      correctiveActions: {
        manualSteps: ['Update config']
      }
    }
  ]
});
```

### Core Services (Client-Side)

#### Application Service
```typescript
core.application.register({
  id: 'myApp',
  title: 'My App',
  euiIconType: 'logoKibana',
  category: DEFAULT_APP_CATEGORIES.kibana,
  mount: async (params: AppMountParameters) => {
    const { renderApp } = await import('./application');
    return renderApp(params);
  }
});
```

**File**: `packages/core/application/core-application-browser/src/application_service.tsx`

#### HTTP Service
```typescript
const response = await core.http.fetch('/api/my-plugin/data', {
  method: 'GET',
  query: { id: '123' }
});
```

#### Notifications Service
```typescript
core.notifications.toasts.addSuccess('Operation completed');
core.notifications.toasts.addError(error, { title: 'Error occurred' });
```

#### Theme Service
```typescript
const theme$ = core.theme.theme$;
theme$.subscribe(theme => {
  // Use theme.darkMode, theme.euiTheme, etc.
});
```

### Plugin-to-Plugin Extension

#### Declaring Dependencies
In `kibana.json`:
```json
{
  "requiredPlugins": ["data", "navigation"],
  "optionalPlugins": ["share"],
  "runtimePluginDependencies": ["security"]
}
```

#### Consuming Dependencies
```typescript
export class MyPlugin implements Plugin {
  setup(core: CoreSetup, plugins: { data: DataSetup; navigation: NavigationSetup }) {
    // Use plugins.data.search.registerSearchStrategy(...)
    // Use plugins.navigation.registerMenuItem(...)
  }

  start(core: CoreStart, plugins: { data: DataStart; share?: ShareStart }) {
    // Optional plugin may be undefined
    if (plugins.share) {
      plugins.share.register(/* ... */);
    }
  }
}
```

#### Runtime Contract Resolution
**Location**: `packages/core/plugins/core-plugins-server-internal/src/plugin_contract_resolver.ts`

For dynamic dependencies resolved at runtime:
```typescript
export class MyPlugin implements Plugin {
  setup(core: CoreSetup) {
    const getSecurityPlugin = () => {
      return core.plugins.onSetup('security');
    };

    // Lazily resolve security plugin contract
    const securityPromise = getSecurityPlugin();
  }
}
```

---

## 7. Configuration & Metadata

### Configuration Schema

**Location**: Plugin's `server/index.ts`

```typescript
import { schema, TypeOf } from '@kbn/config-schema';

const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  apiUrl: schema.string({ defaultValue: 'http://localhost:9200' }),
  timeout: schema.number({ defaultValue: 30000 }),
  advanced: schema.object({
    retries: schema.number({ defaultValue: 3 })
  })
});

export type ConfigType = TypeOf<typeof configSchema>;

export const config: PluginConfigDescriptor<ConfigType> = {
  schema: configSchema,
  exposeToBrowser: {
    apiUrl: true,
    timeout: true
  },
  deprecations: ({ rename, unused }) => [
    rename('oldApiUrl', 'apiUrl'),
    unused('deprecatedSetting')
  ]
};
```

### Accessing Configuration

**In Plugin Constructor**:
```typescript
export class MyPlugin implements Plugin {
  private readonly config: ConfigType;

  constructor(initializerContext: PluginInitializerContext<ConfigType>) {
    this.config = initializerContext.config.get();
  }
}
```

**Reactive Configuration**:
```typescript
export class MyPlugin implements Plugin {
  constructor(private initializerContext: PluginInitializerContext) {}

  setup(core: CoreSetup) {
    this.initializerContext.config.create<ConfigType>().subscribe(config => {
      // Reconfigure service when config changes
      this.myService.reconfigure(config);
    });
  }
}
```

### Dynamic Configuration

**Location**: `PluginConfigDescriptor.dynamicConfig`

Allows runtime updates via `PUT /_settings` API:
```typescript
export const config: PluginConfigDescriptor<ConfigType> = {
  schema: configSchema,
  dynamicConfig: {
    timeout: true,        // Can be updated at runtime
    apiUrl: false         // Cannot be changed without restart
  }
};
```

### Configuration Path

**Default**: `snake_case` version of plugin ID
**Example**: Plugin `myPlugin` → config path `my_plugin`

**Custom Path**:
```json
{
  "id": "security",
  "configPath": ["xpack", "security"]
}
```

Access in `kibana.yml`:
```yaml
xpack.security.enabled: true
```

### Metadata Storage

**Manifest File**: `kibana.json` or `kibana.jsonc`
- Stored in plugin root directory
- Parsed during discovery
- Validated on load
- Immutable after discovery

**Runtime Metadata**: Stored in PluginWrapper
- `manifest`: Full manifest object
- `opaqueId`: Unique symbol for dependency tracking
- `source`: 'oss' | 'x-pack' | 'external'
- `includesServerPlugin`: Boolean
- `includesUiPlugin`: Boolean

### Hot Reload

**Current Capability**: None

Changes to plugin code or configuration require Kibana restart. The architecture doesn't support hot reloading of plugins.

**Development Mode**:
- Client-side code hot reloads via webpack HMR
- Server-side code requires manual restart

---

## 8. Security, Isolation & Error Handling

### Security

#### No Sandboxing
Plugins run in the same Node.js process as Kibana core:
- Full access to `require()` and Node.js APIs
- No security boundaries between plugins
- Trust-based model for plugin code

#### Validation

**Manifest Validation** (`plugin_manifest_parser.ts:68`):
- Required fields validation
- Type checking
- Version compatibility
- Naming convention enforcement (camelCase, no dots)

**Instance Validation** (`plugin.ts:179`):
- Must export `plugin` function
- Instance must be an object
- Must have `setup` method
- Setup/start must be functions

**Configuration Validation**:
- Schema-based validation using `@kbn/config-schema`
- Type safety enforced at runtime
- Invalid config prevents plugin load

**Dependency Validation**:
- Required plugins must exist and be enabled
- Optional plugins gracefully handled if missing
- Circular dependencies detected and rejected
- Cross-compatibility checks (OSS cannot depend on X-Pack)

#### Source Tracking
**Location**: `plugin.ts:218`

```typescript
function getPluginSource(path: string): 'oss' | 'x-pack' | 'external' {
  if (OSS_PATH_REGEX.test(path)) return 'oss';
  if (XPACK_PATH_REGEX.test(path)) return 'x-pack';
  return 'external';
}
```

Prevents OSS plugins from depending on X-Pack plugins.

### Isolation

#### Process Isolation: None
- All plugins run in main Kibana process
- Shared memory space
- No isolation between plugins

#### Configuration Isolation: Yes
- Each plugin has dedicated config namespace
- Config access restricted to plugin's scope
- Browser exposure controlled per plugin

#### Logging Isolation: Yes
**Location**: `plugin_context.ts`

```typescript
const logger = coreContext.logger.get(plugin.name);
// Creates logger with context: plugins.{pluginName}
```

Each plugin gets scoped logger:
- Automatic prefix: `plugins.{pluginName}`
- Sub-loggers: `initializerContext.logger.get('sub')`
- Separate log levels per plugin

#### Resource Isolation: None
- No CPU/memory limits per plugin
- Shared Elasticsearch client pool
- Shared HTTP server

### Error Handling

#### Discovery Errors
**Strategy**: Continue discovering other plugins

```typescript
// plugins_discovery.ts
discover() {
  return {
    plugin$: validPlugins,    // Successfully discovered
    error$: errors             // Failed discoveries
  };
}
```

Errors logged but don't stop other plugins from loading.

#### Initialization Errors
**Strategy**: Fail fast

If plugin fails during `init()`:
- Error thrown
- Plugin not added to system
- Dependent plugins cannot load
- Kibana may fail to start (if critical plugin)

#### Lifecycle Errors

**Setup Phase** (`plugins_system.ts:146`):
```typescript
const contractMaybe = await withTimeout({
  promise: plugin.setup(...),
  timeoutMs: 10 * 1000
});

if (contractMaybe.timedout) {
  throw new Error(`Setup lifecycle of "${pluginName}" plugin wasn't completed in 10sec`);
}
```

**Behavior**:
- Timeout: 10 seconds
- Failure: Throws error, stops Kibana startup
- Dependent plugins: Cannot initialize

**Start Phase** (`plugins_system.ts:208`):
```typescript
const contractMaybe = await withTimeout({
  promise: plugin.start(...),
  timeoutMs: 10 * 1000
});

if (contractMaybe.timedout) {
  throw new Error(`Start lifecycle of "${pluginName}" plugin wasn't completed in 10sec`);
}
```

**Behavior**:
- Timeout: 10 seconds
- Failure: Throws error, stops Kibana startup

**Stop Phase** (`plugins_system.ts:254`):
```typescript
try {
  const resultMaybe = await withTimeout({
    promise: plugin.stop(),
    timeoutMs: 15 * 1000
  });
  if (resultMaybe?.timedout) {
    this.log.warn(`Plugin didn't stop in 15sec, move on to the next`);
  }
} catch (e) {
  this.log.warn(`Plugin thrown during stop: ${e}`);
}
```

**Behavior**:
- Timeout: 15 seconds
- Failure: Logged as warning, doesn't prevent shutdown
- Other plugins: Continue stopping
- Graceful degradation

#### Async Plugin Support
**Status**: Deprecated (to be removed in 8.8.0)

Warning logged in dev mode:
```typescript
if (this.coreContext.env.mode.dev) {
  this.log.warn(
    `Plugin ${pluginName} is using asynchronous setup lifecycle. ` +
    `Asynchronous plugins support will be removed in a later version.`
  );
}
```

#### Error Propagation

**Discovery**: Isolated (stream-based error handling)
**Initialization**: Propagates to startup
**Setup/Start**: Propagates to startup, prevents Kibana from running
**Stop**: Isolated (graceful degradation)

---

## 9. Dependency Management

### Declaring Dependencies

#### Required Dependencies
In `kibana.json`:
```json
{
  "requiredPlugins": ["data", "navigation", "inspector"]
}
```

**Behavior**:
- Plugin won't load if required plugin missing or disabled
- Creates hard dependency edge in graph
- Required plugin contracts guaranteed to exist

#### Optional Dependencies
```json
{
  "optionalPlugins": ["usageCollection", "share"]
}
```

**Behavior**:
- Plugin loads even if optional dependency missing
- Contract may be `undefined` in TypeScript types
- Must check existence before use

#### Runtime Dependencies
```json
{
  "runtimePluginDependencies": ["security"]
}
```

**Behavior**:
- Resolved dynamically at runtime
- Not included in topological sort
- Accessed via contract resolver

**File**: `packages/core/plugins/core-plugins-server-internal/src/plugin_contract_resolver.ts`

```typescript
export class RuntimePluginContractResolver {
  resolveSetupRequests(contracts: Map<PluginName, unknown>) {
    for (const [pluginName, requests] of this.setupRequests) {
      for (const [requestedPluginName, deferred] of requests) {
        const contract = contracts.get(requestedPluginName);
        deferred.resolve(contract);
      }
    }
  }
}
```

#### Bundle Dependencies (Client-Side Only)
```json
{
  "requiredBundles": ["kibanaUtils", "kibanaReact"]
}
```

**Purpose**:
- Tells webpack optimizer about cross-plugin imports
- Ensures bundles loaded in correct order
- Required for code-splitting optimization

**Validation**: Referenced plugins must have `ui: true`

### Dependency Injection

#### Setup Phase Injection
```typescript
export class MyPlugin implements Plugin<MySetup, MyStart, SetupDeps, StartDeps> {
  setup(
    core: CoreSetup<StartDeps, MyStart>,
    plugins: { data: DataSetup; navigation: NavigationSetup }
  ): MySetup {
    // Use plugins.data.search.registerSearchStrategy(...)
    return { /* my setup contract */ };
  }
}
```

**Type Safety**:
```typescript
interface SetupDeps {
  data: DataSetup;
  navigation: NavigationSetup;
  share?: ShareSetup;  // Optional dependency
}
```

#### Start Phase Injection
```typescript
start(
  core: CoreStart,
  plugins: { data: DataStart; share?: ShareStart }
): MyStart {
  // Access plugins.data.search.search(...)
  return { /* my start contract */ };
}
```

#### Accessing Start Contracts in Setup
```typescript
setup(core: CoreSetup<StartDeps, MyStart>) {
  core.getStartServices().then(([coreStart, pluginsStart, myStart]) => {
    // Access start-phase services during setup
    // Useful for registering callbacks that need start contracts
  });
}
```

### Version Constraints

#### Kibana Version Compatibility
**Location**: `plugin_manifest_parser.ts:228`

```typescript
function isVersionCompatible(expectedKibanaVersion, actualKibanaVersion) {
  if (expectedKibanaVersion === 'kibana') {
    return true;  // Always compatible
  }

  // Compare major.minor (ignore patch)
  return coerce(actualKibanaVersion).compare(coerce(expectedKibanaVersion)) === 0;
}
```

**Matching**:
- `"kibanaVersion": "8.0.0"` matches Kibana `8.0.x`
- `"kibanaVersion": "kibana"` matches any version
- Mismatch prevents plugin from loading

#### Plugin-to-Plugin Versions
**Not Enforced**: No version constraints between plugins

Dependencies specified by name only:
```json
{
  "requiredPlugins": ["data"]  // No version specified
}
```

All plugins in a Kibana instance share the same version (Kibana version).

### Dependency Validation

**Location**: `packages/core/plugins/core-plugins-server-internal/src/plugins_service.ts`

**Checks**:
1. **Existence**: Required plugins must exist in discovered plugins
2. **Enablement**: Required plugins must be enabled
3. **Type Compatibility**: Can't mix preboot and standard dependencies
4. **Source Compatibility**: OSS plugins can't depend on X-Pack
5. **Bundle Validation**: requiredBundles must reference UI plugins
6. **Circular Dependencies**: Detected during topological sort

**Example Validation**:
```typescript
const missingRequiredPlugins = plugin.requiredPlugins.filter(
  dep => !plugins.has(dep)
);

if (missingRequiredPlugins.length > 0) {
  throw new Error(
    `Plugin "${plugin.name}" requires plugins [${missingRequiredPlugins}] which are missing`
  );
}
```

### Service Locator Pattern

Not used. Kibana uses explicit dependency injection rather than service locator.

Plugins don't lookup services - they receive them via constructor and lifecycle methods.

---

## 10. Architecture Diagram

### High-Level Plugin System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         KIBANA BOOTSTRAP                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PLUGINS SERVICE                            │
│  - Coordinates discovery and lifecycle                          │
│  - Manages preboot and standard plugin systems                  │
└─────┬───────────────────────────────────────────────────────┬───┘
      │                                                       │
      ▼                                                       ▼
┌──────────────────────────┐                    ┌──────────────────────────┐
│   PLUGIN DISCOVERY       │                    │   PLUGIN SYSTEM          │
│  ┌────────────────────┐  │                    │  ┌────────────────────┐  │
│  │ Scan Directories   │  │                    │  │ Plugin Registry    │  │
│  │   - src/plugins    │  │                    │  │  Map<Name,Wrapper> │  │
│  │   - x-pack/plugins │  │                    │  └────────────────────┘  │
│  │   - custom paths   │  │                    │  ┌────────────────────┐  │
│  └────────┬───────────┘  │                    │  │ Topological Sort   │  │
│           │              │                    │  │  (Kahn Algorithm)  │  │
│           ▼              │                    │  └────────┬───────────┘  │
│  ┌────────────────────┐  │                    │           │              │
│  │ Parse Manifests    │  │                    │           ▼              │
│  │  (kibana.json)     │  │                    │  ┌────────────────────┐  │
│  └────────┬───────────┘  │                    │  │ Lifecycle Manager  │  │
│           │              │                    │  │  - setupPlugins()  │  │
│           ▼              │                    │  │  - startPlugins()  │  │
│  ┌────────────────────┐  │                    │  │  - stopPlugins()   │  │
│  │ Validate & Filter  │  │                    │  └────────────────────┘  │
│  │  - Version check   │  │                    └──────────────────────────┘
│  │  - Schema valid    │  │
│  └────────┬───────────┘  │
│           │              │
│           ▼              │
│  ┌────────────────────┐  │
│  │ Create Wrappers    │  │
│  │  PluginWrapper()   │  │
│  └────────────────────┘  │
└──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PLUGIN WRAPPER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   MANIFEST   │  │   METADATA   │  │   INSTANCE   │          │
│  │  - id        │  │  - opaqueId  │  │  - plugin    │          │
│  │  - version   │  │  - source    │  │  - setup()   │          │
│  │  - deps      │  │  - path      │  │  - start()   │          │
│  └──────────────┘  └──────────────┘  │  - stop()    │          │
│                                      └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PLUGIN LIFECYCLE                             │
│                                                                 │
│  1. INIT           2. SETUP            3. START                │
│  ┌──────────┐     ┌──────────┐        ┌──────────┐            │
│  │ Load     │────▶│ Register │───────▶│ Activate │            │
│  │ Code     │     │ Resources│        │ Services │            │
│  └──────────┘     └──────────┘        └────┬─────┘            │
│                                            │                   │
│                   4. STOP                  │                   │
│                   ┌──────────┐             │                   │
│                   │ Cleanup  │◀────────────┘                   │
│                   │ Resources│                                 │
│                   └──────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CORE SERVICES (Injected)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SETUP PHASE                    │  START PHASE           │  │
│  │  - http (router creation)       │  - elasticsearch       │  │
│  │  - savedObjects (type reg)      │  - savedObjects (CRUD) │  │
│  │  - uiSettings (register)        │  - uiSettings (get)    │  │
│  │  - capabilities                 │  - Full services       │  │
│  │  - deprecations                 │                        │  │
│  │  - getStartServices()           │                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 PLUGIN CONTRACTS (Returned)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Plugin A                                                │  │
│  │  setup() ────▶ SetupContract ────▶ Injected to Plugin B │  │
│  │  start() ────▶ StartContract ────▶ Injected to Plugin B │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Dependency Resolution Flow

```
Plugin Graph (Example):

    ┌─────────┐
    │  Core   │
    └────┬────┘
         │
    ┌────┴──────────────┬──────────┐
    │                   │          │
    ▼                   ▼          ▼
┌────────┐         ┌────────┐  ┌──────┐
│  Data  │         │  UI    │  │ Mgmt │
└───┬────┘         │Actions │  └──────┘
    │              └────────┘
    │
    ▼
┌─────────────┐
│ Visualize   │
└─────────────┘

Topological Order (Kahn's Algorithm):
1. Core (no dependencies)
2. Data, UIActions, Mgmt (depend only on Core)
3. Visualize (depends on Data)

Setup Execution Order:
  Core Services → Data.setup() → UIActions.setup() → Mgmt.setup() → Visualize.setup()

Start Execution Order:
  Core Services → Data.start() → UIActions.start() → Mgmt.start() → Visualize.start()

Stop Execution Order:
  Visualize.stop() → Data.stop() → UIActions.stop() → Mgmt.stop()
```

### Plugin Loading Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLUGIN LOADING SEQUENCE                      │
└─────────────────────────────────────────────────────────────────┘

Server Side:                          Client Side:
┌──────────────────────┐              ┌──────────────────────┐
│ 1. Scan Filesystem   │              │ 1. Receive Metadata  │
│    - Find kibana.json│              │    from Server       │
└──────────┬───────────┘              └──────────┬───────────┘
           │                                     │
           ▼                                     ▼
┌──────────────────────┐              ┌──────────────────────┐
│ 2. Parse Manifests   │              │ 2. Create Plugin     │
│    - Validate        │              │    Wrappers          │
└──────────┬───────────┘              └──────────┬───────────┘
           │                                     │
           ▼                                     ▼
┌──────────────────────┐              ┌──────────────────────┐
│ 3. Create Wrappers   │              │ 3. Load Bundles      │
│    - PluginWrapper() │              │    - Dynamic import  │
└──────────┬───────────┘              └──────────┬───────────┘
           │                                     │
           ▼                                     ▼
┌──────────────────────┐              ┌──────────────────────┐
│ 4. Init Plugins      │              │ 4. Init Plugins      │
│    - require()       │              │    - plugin()        │
│    - plugin()        │              └──────────┬───────────┘
└──────────┬───────────┘                         │
           │                                     │
           ▼                                     ▼
┌──────────────────────┐              ┌──────────────────────┐
│ 5. Setup Phase       │              │ 5. Setup Phase       │
│    - Topological     │              │    - Topological     │
└──────────┬───────────┘              └──────────┬───────────┘
           │                                     │
           ▼                                     ▼
┌──────────────────────┐              ┌──────────────────────┐
│ 6. Start Phase       │              │ 6. Start Phase       │
│    - Activate        │              │    - Activate        │
└──────────────────────┘              └──────────────────────┘
```

---

## 11. Improvement Recommendations

### Performance

1. **Lazy Plugin Loading**
   - **Current**: All plugins loaded at startup
   - **Improvement**: Load non-critical plugins on-demand
   - **Benefit**: Faster startup time, reduced memory footprint
   - **Implementation**:
     - Add `lazyLoad: true` to manifest
     - Defer initialization until first use
     - Requires contract proxying for dependencies

2. **Parallel Plugin Initialization**
   - **Current**: Serial initialization within dependency tiers
   - **Improvement**: Parallel init for plugins at same tier
   - **Benefit**: Faster startup (could save 20-40%)
   - **Implementation**:
     ```typescript
     // Instead of:
     for (const plugin of sortedPlugins) {
       await plugin.setup();
     }

     // Use:
     const tiers = groupByDependencyTier(sortedPlugins);
     for (const tier of tiers) {
       await Promise.all(tier.map(p => p.setup()));
     }
     ```

3. **Bundle Optimization**
   - **Current**: Each plugin builds separate bundle
   - **Improvement**: Shared chunk optimization
   - **Benefit**: Reduced bundle size, faster client load
   - **Implementation**: webpack `splitChunks` with plugin awareness

4. **Config Caching**
   - **Current**: Config re-parsed on every access
   - **Improvement**: Cache validated config objects
   - **Benefit**: Reduced CPU during startup
   - **Implementation**: Memoize `initializerContext.config.get()`

### Stability

1. **Plugin Isolation**
   - **Current**: Plugins share process, memory crashes affect all
   - **Improvement**: Optional worker-based plugin isolation
   - **Benefit**: Failure in one plugin doesn't crash Kibana
   - **Implementation**:
     ```typescript
     // In manifest:
     { "isolation": "worker" }

     // Core spawns worker process for plugin
     // IPC for contract communication
     ```

2. **Graceful Degradation**
   - **Current**: Failed plugin prevents startup
   - **Improvement**: Mark failed plugins as disabled, continue
   - **Benefit**: Kibana stays operational with partial features
   - **Implementation**:
     - Add `required: false` to manifest
     - UI indicates disabled plugins
     - API returns feature unavailable errors

3. **Health Monitoring**
   - **Current**: No runtime health checks
   - **Improvement**: Optional `health()` lifecycle method
   - **Benefit**: Detect and handle plugin failures during runtime
   - **Implementation**:
     ```typescript
     export interface Plugin {
       setup(), start(), stop()
       health?(): Promise<{ status: 'ok' | 'degraded' | 'down' }>
     }
     ```

4. **Resource Limits**
   - **Current**: No limits on plugin resource usage
   - **Improvement**: Optional CPU/memory budgets
   - **Benefit**: Prevent runaway plugins from affecting system
   - **Implementation**: v8 heap limits, CPU time tracking

### Cleaner Extension Points

1. **Event Bus**
   - **Current**: Direct plugin-to-plugin calls
   - **Improvement**: Optional core event bus
   - **Benefit**: Loose coupling, easier testing
   - **Implementation**:
     ```typescript
     core.events.emit('data:indexPatternCreated', { id: '123' });
     core.events.on('data:indexPatternCreated', handler);
     ```

2. **Extension Registry**
   - **Current**: Extensions scattered across services
   - **Improvement**: Unified extension point registry
   - **Benefit**: Discoverability, documentation
   - **Implementation**:
     ```typescript
     core.extensions.register('ui:navbar', NavbarExtension);
     const navbarExtensions = core.extensions.get('ui:navbar');
     ```

3. **Hook System**
   - **Current**: Limited middleware/interceptor support
   - **Improvement**: Standardized hook points
   - **Benefit**: Consistent plugin extension patterns
   - **Implementation**:
     ```typescript
     core.hooks.register('http:beforeResponse', async (request, response) => {
       // Transform response
     });
     ```

4. **Provider Pattern**
   - **Current**: Direct service registration
   - **Improvement**: Provider-based service registration
   - **Benefit**: Lazy initialization, testability
   - **Implementation**:
     ```typescript
     core.providers.register('myService', {
       factory: (deps) => new MyService(deps),
       dependencies: ['elasticsearch']
     });
     ```

### Better Lifecycle APIs

1. **Lifecycle Hooks**
   - **Current**: Only setup/start/stop
   - **Improvement**: Additional hooks
   - **Benefit**: Finer-grained control
   - **New Hooks**:
     - `beforeSetup()`: Pre-initialization
     - `afterSetup()`: Post-setup tasks
     - `onConfigChange()`: Config updates
     - `onPluginEnabled()`: Another plugin loaded

2. **Async Lifecycle Support**
   - **Current**: Being deprecated
   - **Improvement**: Keep async but with better ergonomics
   - **Benefit**: Simpler async initialization
   - **Implementation**:
     ```typescript
     async setup(core, plugins) {
       await this.initializeAsync();
       return contract;
     }
     ```
   - Keep timeouts, improve error messages

3. **Lifecycle Events**
   - **Current**: No visibility into lifecycle progress
   - **Improvement**: Observable lifecycle events
   - **Benefit**: Better monitoring, debugging
   - **Implementation**:
     ```typescript
     core.lifecycle.events$.subscribe(event => {
       // { type: 'pluginSetupStart', plugin: 'data' }
     });
     ```

4. **Conditional Initialization**
   - **Current**: All enabled plugins always initialize
   - **Improvement**: Conditional plugin loading
   - **Benefit**: Feature flags, A/B testing
   - **Implementation**:
     ```typescript
     export const config = {
       enableWhen: (context) => context.config.experimentalFeatures.newFeature
     };
     ```

### Safer Plugin Execution

1. **Contract Versioning**
   - **Current**: No version checking for plugin contracts
   - **Improvement**: Semantic versioning for contracts
   - **Benefit**: Catch breaking changes at runtime
   - **Implementation**:
     ```typescript
     setup(): DataSetup {
       return {
         __version: '2.0.0',
         search: this.searchService.setup()
       };
     }

     // Consuming plugin validates version
     ```

2. **Type Safety at Runtime**
   - **Current**: TypeScript only compile-time
   - **Improvement**: Runtime contract validation
   - **Benefit**: Catch type mismatches in production
   - **Implementation**:
     ```typescript
     export const contract = {
       schema: schema.object({
         search: schema.function()
       })
     };
     ```

3. **Permission Model**
   - **Current**: Plugins have full access to core
   - **Improvement**: Capability-based permissions
   - **Benefit**: Limit blast radius of malicious/buggy plugins
   - **Implementation**:
     ```json
     {
       "permissions": {
         "elasticsearch": ["read"],
         "savedObjects": ["read", "write"]
       }
     }
     ```

4. **Rollback Support**
   - **Current**: No rollback on failed initialization
   - **Improvement**: Transactional setup phase
   - **Benefit**: Clean state on failure
   - **Implementation**:
     ```typescript
     class Plugin {
       setup() {
         const transaction = core.transaction();
         transaction.registerRoute('/api/foo', handler);
         transaction.registerSavedObjectType('foo', {...});
         return transaction.commit();
       }
     }
     ```

### Developer Experience

1. **Plugin Generator**
   - Scaffold new plugins with correct structure
   - Interactive CLI for common patterns
   - Template selection (simple, full-featured, etc.)

2. **Hot Reload for Server**
   - Watch server plugin files
   - Reload plugins without full restart
   - Preserve state where possible

3. **Plugin Documentation**
   - Auto-generate API docs from TypeScript
   - Contract visualization
   - Dependency graph viewer

4. **Testing Utilities**
   - Mock core services
   - Plugin test harness
   - Contract compatibility testing

5. **Dependency Analyzer**
   - Visualize plugin dependency graph
   - Detect potential circular dependencies
   - Suggest optimization opportunities

---

## Conclusion

Kibana's plugin architecture is a **mature, well-designed manifest-based dependency injection system** that effectively addresses the needs of a large, modular application. Its strengths include:

- **Strong Type Safety**: TypeScript contracts enforce API boundaries
- **Explicit Dependencies**: Clear declaration and injection
- **Lifecycle Coordination**: Robust setup/start/stop orchestration
- **Dual Environment**: Unified pattern for server and client
- **Configuration Management**: Schema-based validation and isolation

Key areas for improvement focus on **performance** (parallel loading, lazy initialization), **stability** (isolation, graceful degradation), and **developer experience** (better tooling, documentation).

The architecture has evolved organically but maintains strong foundational patterns that support Kibana's growth from a monolith to a plugin-based ecosystem supporting hundreds of features across OSS and commercial offerings.
