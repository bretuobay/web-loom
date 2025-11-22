# Chapter: Manifest-Based Dependency Injection - The Kibana Plugin Architecture

## Introduction

In the landscape of plugin architectures for web applications, Kibana represents a sophisticated evolution of the manifest-based dependency injection pattern. Born from the need to transform a monolithic visualization platform into a modular, extensible ecosystem, Kibana's plugin architecture demonstrates how a well-designed system can scale to support hundreds of features while maintaining strong guarantees about dependency resolution, lifecycle coordination, and type safety.

This chapter examines Kibana's plugin architecture as a case study in building production-grade, dual-environment (server and browser) plugin systems. We'll explore the architectural decisions, trade-offs, and patterns that enable Elastic's flagship product to support both open-source and commercial features through a unified plugin model.

## Architectural Philosophy

### The Manifest-Based Approach

At its core, Kibana employs a **manifest-based discovery system**. Each plugin declares its identity, capabilities, and dependencies in a `kibana.json` file located at its root directory:

```json
{
  "id": "data",
  "version": "8.0.0",
  "server": true,
  "browser": true,
  "requiredPlugins": ["expressions", "fieldFormats"],
  "optionalPlugins": ["usageCollection"],
  "owner": {
    "name": "Data Discovery",
    "githubTeam": "@elastic/kibana-data-discovery"
  }
}
```

This declarative approach offers several advantages over code-based discovery:

1. **Static Analysis**: Dependencies are known before code execution
2. **Validation**: Manifest structure validated at parse time
3. **Documentation**: Plugin capabilities self-documented
4. **Tooling**: Build systems can optimize bundles based on declared dependencies

### Dependency Injection Over Service Locator

Kibana deliberately chose dependency injection over the service locator pattern. Rather than plugins querying a global registry for dependencies, the plugin system **injects** both core services and plugin contracts directly into lifecycle methods:

```typescript
export class MyPlugin implements Plugin {
  setup(
    core: CoreSetup,
    plugins: { data: DataSetup; navigation: NavigationSetup }
  ) {
    // Dependencies injected - no global registry lookup needed
    plugins.data.search.registerSearchStrategy(/*...*/);
  }
}
```

This pattern provides:
- **Explicit Dependencies**: Clear from type signatures
- **Type Safety**: TypeScript enforces contract compatibility
- **Testability**: Easy to mock injected dependencies
- **No Hidden Coupling**: All dependencies declared upfront

### Dual-Environment Symmetry

A unique aspect of Kibana's architecture is its **symmetric plugin model** across server (Node.js) and client (browser) environments. Both environments share:

- Same lifecycle phases (setup → start → stop)
- Same dependency injection pattern
- Same manifest-based discovery
- Parallel but independent execution

This symmetry reduces cognitive load for developers and allows plugins to naturally split server and client concerns while maintaining a unified conceptual model.

## Core Architectural Components

### 1. The Discovery Pipeline

Plugin discovery in Kibana is a **stream-based, non-blocking** process that separates successful discoveries from errors:

```typescript
discover() {
  return {
    plugin$: Observable<PluginManifest>,  // Successfully discovered
    error$: Observable<PluginError>        // Failed discoveries
  };
}
```

**Discovery Process**:
1. Scan configured plugin directories recursively
2. Locate `kibana.json` manifest files
3. Parse and validate manifest structure
4. Check Kibana version compatibility
5. Stream results to plugin system

This design ensures **isolation of failures** - a malformed plugin doesn't prevent discovery of others.

**Key Innovation**: Using RxJS observables for discovery allows the system to:
- Process plugins as they're found (no blocking)
- Handle errors independently
- Compose discovery streams from multiple sources
- Support asynchronous validation

### 2. The Plugin Wrapper

Each discovered plugin is encapsulated in a `PluginWrapper` - a lightweight container responsible for:

```typescript
class PluginWrapper {
  public readonly manifest: PluginManifest;
  public readonly opaqueId: symbol;
  public readonly source: 'oss' | 'x-pack' | 'external';

  private instance?: Plugin;

  async init() {
    // Load plugin code via require()
    const pluginDef = require(this.path + '/server');
    this.instance = await pluginDef.plugin(initializerContext);
  }

  setup(coreSetup, pluginDeps) {
    return this.instance.setup(coreSetup, pluginDeps);
  }
}
```

The wrapper pattern provides:
- **Lazy Loading**: Code loaded only when needed
- **Lifecycle Dispatch**: Coordinates setup/start/stop calls
- **Dependency Resolution**: Collects and injects plugin contracts
- **Metadata Access**: Exposes manifest without loading code

**Source Classification** (`oss`, `x-pack`, `external`) enables **cross-compatibility validation** - preventing OSS plugins from depending on commercial features.

### 3. Topological Sorting for Dependency Order

The heart of Kibana's plugin system is its **topological sorting** using Kahn's Algorithm. This ensures plugins initialize in dependency order:

```
Given:
  - Plugin A depends on B, C
  - Plugin B depends on C
  - Plugin C has no dependencies

Topological Order: C → B → A
```

**Algorithm Implementation**:
1. Build directed acyclic graph (DAG) of dependencies
2. Find all plugins with zero dependencies (start nodes)
3. Process each start node:
   - Add to sorted list
   - Remove from graph
   - Update dependent plugins' dependency counts
4. Repeat until graph empty
5. If graph not empty → **circular dependency detected**

This approach guarantees:
- **Deterministic Order**: Same order every startup
- **Cycle Detection**: Fails fast on circular dependencies
- **Optimal Scheduling**: Minimal initialization time given constraints

### 4. Lifecycle Orchestration

Kibana's lifecycle is divided into three phases:

#### Setup Phase
**Purpose**: Register resources, configure services
**Timeout**: 10 seconds per plugin
**Execution**: Sequential in topological order

```typescript
async setupPlugins() {
  for (const plugin of sortedPlugins) {
    const pluginDeps = collectSetupContracts(plugin);
    const contract = await plugin.setup(coreSetup, pluginDeps);
    contracts.set(plugin.name, contract);
  }
}
```

**Core Services Available**:
- HTTP router creation
- Saved object type registration
- UI settings registration
- Capability registration
- Access to start services (via promise)

#### Start Phase
**Purpose**: Activate services, begin processing
**Timeout**: 10 seconds per plugin
**Execution**: Sequential in topological order

```typescript
async startPlugins() {
  for (const plugin of setupPlugins) {
    const pluginDeps = collectStartContracts(plugin);
    const contract = await plugin.start(coreStart, pluginDeps);
    contracts.set(plugin.name, contract);
  }
}
```

**Core Services Available**:
- Elasticsearch client
- Saved objects CRUD
- Full service access

#### Stop Phase
**Purpose**: Cleanup, close connections
**Timeout**: 15 seconds per plugin
**Execution**: **Reverse** topological order
**Error Handling**: Graceful - failures logged but don't block

```typescript
async stopPlugins() {
  // Build reverse dependency map
  for (let i = plugins.length - 1; i >= 0; i--) {
    await Promise.all(waitForDependents());
    await plugin.stop();
  }
}
```

**Key Design**: Stop order is **reversed** - dependents stop before dependencies, preventing use-after-free scenarios.

### 5. Configuration Management

Kibana's configuration system integrates tightly with the plugin architecture through the **PluginConfigDescriptor**:

```typescript
export const config: PluginConfigDescriptor<ConfigType> = {
  schema: schema.object({
    enabled: schema.boolean({ defaultValue: true }),
    apiUrl: schema.string(),
  }),

  exposeToBrowser: {
    apiUrl: true  // Available to client-side plugin
  },

  deprecations: ({ rename }) => [
    rename('oldApiUrl', 'apiUrl')
  ],

  dynamicConfig: {
    apiUrl: false  // Requires restart to change
  }
};
```

**Features**:
- **Schema-based Validation**: Runtime type checking
- **Browser Exposure Control**: Granular client config access
- **Deprecation Handling**: Automated migration warnings
- **Dynamic Updates**: Runtime-reconfigurable properties
- **Namespace Isolation**: Each plugin has dedicated config path

**Config Access**:
```typescript
// Synchronous (constructor)
constructor(initCtx: PluginInitializerContext) {
  this.config = initCtx.config.get<ConfigType>();
}

// Reactive (lifecycle)
setup(core: CoreSetup) {
  initCtx.config.create<ConfigType>().subscribe(config => {
    this.service.reconfigure(config);
  });
}
```

## Patterns and Practices

### The Contract Pattern

Kibana plugins communicate through **contracts** - type-safe interfaces returned from lifecycle methods:

```typescript
// Data plugin exposes search functionality
class DataPlugin implements Plugin<DataSetup, DataStart> {
  setup(): DataSetup {
    return {
      search: {
        registerSearchStrategy: (name, strategy) => {/*...*/}
      }
    };
  }

  start(): DataStart {
    return {
      search: {
        search: (request) => {/*...*/}
      }
    };
  }
}

// Consumer plugin receives typed contract
class VisualizationPlugin implements Plugin {
  setup(core, { data }: { data: DataSetup }) {
    data.search.registerSearchStrategy('myStrategy', /*...*/);
  }
}
```

**Benefits**:
- **Type Safety**: Compile-time contract validation
- **Clear API Boundaries**: What's exposed is explicit
- **Versioning**: Contracts evolve independently
- **Documentation**: Types serve as API documentation

### Optional vs Required Dependencies

Kibana distinguishes three dependency types:

**Required Dependencies**:
```json
"requiredPlugins": ["data", "navigation"]
```
- Plugin won't load if dependency missing
- Contract guaranteed to exist
- TypeScript type: `{ data: DataSetup }`

**Optional Dependencies**:
```json
"optionalPlugins": ["share"]
```
- Plugin loads even if dependency missing
- Contract may be undefined
- TypeScript type: `{ share?: ShareSetup }`

**Runtime Dependencies**:
```json
"runtimePluginDependencies": ["security"]
```
- Resolved dynamically at runtime
- Not part of topological sort
- Accessed via contract resolver

**Usage Pattern**:
```typescript
setup(core, plugins: { data: DataSetup; share?: ShareSetup }) {
  // Always available
  plugins.data.search.registerSearchStrategy(/*...*/);

  // Conditional feature
  if (plugins.share) {
    plugins.share.register(/*...*/);
  }
}
```

### The Preboot Plugin Pattern

For critical initialization that must occur before standard plugins, Kibana provides **preboot plugins**:

```typescript
export interface PrebootPlugin<TSetup> {
  setup(core: CorePreboot, plugins: TPluginsSetup): TSetup;
  stop?(): void;
}
```

**Characteristics**:
- No `start` phase (setup only)
- Execute before standard plugins
- Stopped before standard plugins start
- Used for: critical config, security bootstrapping, migrations

**Example Use Case**: Interactive setup plugins that guide users through initial configuration before Kibana fully starts.

### Accessing Start Contracts During Setup

A common pattern is needing start-phase contracts during setup (e.g., for registering callbacks):

```typescript
setup(core: CoreSetup<StartDeps, MyStart>) {
  core.getStartServices().then(([coreStart, pluginsStart, myStart]) => {
    // Register route handler that needs start-phase services
    router.get('/api/search', async () => {
      return pluginsStart.data.search.search(request);
    });
  });
}
```

**Pattern**: `getStartServices()` returns a promise that resolves when start phase begins, providing access to all start contracts.

## Advanced Architectural Features

### Runtime Contract Resolution

For plugins that need to resolve dependencies dynamically (not known at build time), Kibana provides a **runtime contract resolver**:

```typescript
class RuntimePluginContractResolver {
  private setupRequests = new Map<PluginName, Map<PluginName, Deferred>>();

  // Plugin requests contract
  requestSetupContract(requester: string, requested: string): Promise<unknown> {
    const deferred = new Deferred();
    this.setupRequests.get(requester)!.set(requested, deferred);
    return deferred.promise;
  }

  // System resolves after setup completes
  resolveSetupRequests(contracts: Map<PluginName, unknown>) {
    for (const [requester, requests] of this.setupRequests) {
      for (const [requested, deferred] of requests) {
        deferred.resolve(contracts.get(requested));
      }
    }
  }
}
```

**Use Case**: Plugins that conditionally depend on other plugins based on runtime configuration.

### Browser Bundle Optimization

Client-side plugins declare bundle dependencies separately from runtime dependencies:

```json
{
  "requiredPlugins": ["data"],      // Runtime dependency
  "requiredBundles": ["kibanaReact"] // Build-time dependency
}
```

**Distinction**:
- `requiredPlugins`: Must be enabled at runtime
- `requiredBundles`: Code imported during build (webpack optimization)

This separation allows:
- Webpack to optimize chunk splitting
- Code sharing across plugin boundaries
- Lazy loading of plugin bundles
- Tree shaking of unused exports

### Plugin Enablement and Conditional Loading

Plugins can be conditionally enabled based on:

**License** (commercial features):
```typescript
if (!license.hasFeature('security')) {
  return; // Don't initialize security features
}
```

**Node Role** (distributed deployments):
```typescript
if (initCtx.node.roles.backgroundTasks) {
  // Only run on background task nodes
  setupTaskManager();
}
```

**Feature Flags**:
```typescript
if (config.experimentalFeatures.newViz) {
  registerNewVisualization();
}
```

## Error Handling and Resilience

### Failure Isolation

Kibana's plugin system implements **fail-fast during startup, graceful during shutdown**:

**Discovery Errors**: Isolated
```typescript
discover() {
  return {
    plugin$: validPlugins,
    error$: errors  // Logged but don't stop discovery
  };
}
```

**Initialization Errors**: Fail-fast
```typescript
if (!instance.setup) {
  throw new Error('Plugin missing setup method');
}
```

**Setup/Start Errors**: Fail-fast
```typescript
const result = await withTimeout({
  promise: plugin.setup(),
  timeoutMs: 10000
});

if (result.timedout) {
  throw new Error('Plugin setup timeout');
}
```

**Stop Errors**: Graceful
```typescript
try {
  await plugin.stop();
} catch (e) {
  log.warn(`Plugin failed to stop: ${e}`);
  // Continue stopping other plugins
}
```

### Timeout Management

Each lifecycle phase has graduated timeouts:
- **Setup**: 10 seconds
- **Start**: 10 seconds
- **Stop**: 15 seconds (longer to allow graceful cleanup)

Timeouts prevent hung plugins from blocking startup/shutdown:

```typescript
const result = await withTimeout({
  promise: plugin.setup(context, deps),
  timeoutMs: 10 * 1000
});

if (result.timedout) {
  throw new Error(
    `Setup lifecycle of "${pluginName}" plugin wasn't completed in 10sec. ` +
    `Consider disabling the plugin and re-start.`
  );
}
```

### Validation Layers

Kibana employs **defense in depth** for plugin validation:

**Layer 1: Manifest Validation**
- Required fields present
- Types correct
- Naming conventions followed
- Version compatibility

**Layer 2: Dependency Validation**
- Required plugins exist
- No circular dependencies
- Source compatibility (OSS/X-Pack)
- Type compatibility (preboot/standard)

**Layer 3: Code Validation**
- Exports `plugin` function
- Function returns plugin instance
- Instance has `setup` method
- Setup returns object (contract)

**Layer 4: Runtime Validation**
- Schema validation of configs
- Type checking of contracts (via TypeScript)
- Capability checks before feature use

## Security Considerations

### Trust-Based Model

Kibana's plugin system operates on a **trust-based model**:
- No sandboxing or isolation
- Plugins run in same Node.js process
- Full access to `require()` and Node APIs
- No resource limits (CPU, memory)

**Rationale**: All plugins in a Kibana instance are considered **first-party** or **trusted third-party** code. The system prioritizes performance and simplicity over isolation.

**Implications**:
- Plugin code reviews critical
- Malicious plugin could compromise entire system
- Plugin bugs can crash Kibana
- No defense against resource exhaustion

### Source-Based Access Control

Kibana implements **source-based validation** to prevent architectural violations:

```typescript
function getPluginSource(path: string): 'oss' | 'x-pack' | 'external' {
  if (path.includes('src/plugins')) return 'oss';
  if (path.includes('x-pack/plugins')) return 'x-pack';
  return 'external';
}

// Validation
if (plugin.source === 'oss' && dependency.source === 'x-pack') {
  throw new Error('OSS plugin cannot depend on X-Pack plugin');
}
```

**Purpose**: Maintain clean separation between open-source and commercial code.

### Configuration Isolation

Each plugin has **isolated configuration namespace**:

```yaml
# kibana.yml
my_plugin:
  enabled: true
  api_url: http://localhost

data:
  search:
    timeout: 30000
```

Plugins cannot access other plugins' configuration directly, enforcing boundaries.

## Performance Characteristics

### Startup Performance

**Current Behavior**:
- Plugins loaded serially (within dependency tiers)
- All plugins loaded at startup (no lazy loading)
- ~100-200 plugins in typical Kibana instance
- Startup time: 30-60 seconds (depending on plugin count)

**Optimization Opportunities**:
1. **Parallel initialization** within tiers (30-40% improvement potential)
2. **Lazy loading** of non-critical plugins (faster startup)
3. **Cached compilation** of plugin code

### Runtime Performance

**Memory Overhead**:
- Each plugin: ~5-50 MB (varies widely)
- Wrapper overhead: negligible (~1 KB per plugin)
- Contract storage: minimal (references only)

**Contract Resolution**:
- O(1) lookup in contract Map
- No serialization overhead (in-process)
- Type checking at compile time (zero runtime cost)

### Client-Side Loading

**Bundle Strategy**:
- Each plugin compiled to separate bundle
- Common dependencies in shared chunks
- Lazy loading via dynamic imports
- Code splitting by route

**Loading Sequence**:
1. Receive plugin metadata from server (~10 KB)
2. Load plugin bundles on-demand (~50-500 KB per plugin)
3. Initialize in dependency order
4. Render UI

## Lessons and Trade-offs

### What Works Well

**1. Type Safety**
TypeScript contracts provide compile-time validation of plugin interactions - a major advantage over runtime-only systems.

**2. Explicit Dependencies**
Manifest-based declaration makes dependencies visible and analyzable before code execution.

**3. Lifecycle Coordination**
The setup/start/stop model with topological sorting ensures orderly initialization and shutdown.

**4. Dual Environment Support**
Symmetric patterns across server and client reduce cognitive load and code duplication.

**5. Configuration Management**
Schema-based validation and namespace isolation prevent configuration errors.

### Trade-offs and Limitations

**1. No Hot Reloading**
Changing plugin code requires full restart. During development this slows iteration.

**Trade-off**: Simplicity and correctness over developer convenience.

**2. No Isolation**
Plugins share process space, memory, and resources.

**Trade-off**: Performance and simplicity over security and fault isolation.

**3. Serial Loading**
Plugins initialize sequentially within dependency tiers.

**Trade-off**: Implementation simplicity over startup performance.

**4. No Versioning**
Plugin-to-plugin dependencies don't specify versions - all plugins must be compatible with the same Kibana version.

**Trade-off**: Simplicity over flexibility (acceptable for monorepo).

**5. Trust-Based Security**
No sandboxing or permission model.

**Trade-off**: Performance over security (acceptable for first-party code).

## Comparative Analysis

### vs. VS Code Extensions

**Similarities**:
- Manifest-based discovery
- Dependency injection
- Activation events (lifecycle)

**Differences**:
- VS Code: Process isolation per extension
- Kibana: Shared process, no isolation
- VS Code: Extension host protocol (IPC)
- Kibana: In-process contracts (direct calls)

**Trade-off**: Kibana prioritizes performance; VS Code prioritizes isolation.

### vs. Webpack Plugins

**Similarities**:
- Hook-based extension points
- Plugin registration system

**Differences**:
- Webpack: Synchronous, build-time
- Kibana: Asynchronous, runtime
- Webpack: No dependency injection
- Kibana: Full DI with contracts

**Philosophy**: Webpack plugins **transform**, Kibana plugins **extend**.

### vs. Express Middleware

**Similarities**:
- Linear execution order
- Request/response modification

**Differences**:
- Express: Request-scoped, no state
- Kibana: Application-scoped, stateful
- Express: Simple function composition
- Kibana: Complex lifecycle with dependencies

**Scope**: Express middleware is a micro-pattern; Kibana plugins are macro-architecture.

## Evolution and Future Directions

### Historical Context

Kibana's plugin architecture evolved through several iterations:

**Generation 1** (2015-2016): Informal plugin system
- Plugins manually required
- No dependency management
- Global state sharing

**Generation 2** (2017-2018): Manifest-based system
- `kibana.json` introduced
- Dependency declaration
- Basic lifecycle (setup/start)

**Generation 3** (2019-2020): New Platform
- Type-safe contracts
- Dual environment support
- Configuration isolation
- Current architecture

### Emerging Patterns

**1. Micro-Frontends**
Plugins increasingly act as micro-frontends:
- Independent bundles
- Isolated React trees
- Cross-plugin communication via contracts

**2. Service-Oriented Architecture**
Backend plugins expose service contracts:
- Well-defined APIs
- Version stability
- Contract testing

**3. Feature Flags**
Dynamic feature enablement:
- Conditional plugin loading
- Gradual rollouts
- A/B testing support

### Potential Improvements

**Performance**:
- Parallel plugin initialization
- Lazy loading of non-critical plugins
- Shared chunk optimization

**Resilience**:
- Optional plugin isolation (worker processes)
- Graceful degradation on failures
- Health monitoring

**Developer Experience**:
- Hot reload for server plugins
- Better debugging tools
- Plugin dependency visualizer

**Type Safety**:
- Runtime contract validation
- Version compatibility checking
- Breaking change detection

## Conclusion

Kibana's plugin architecture represents a **pragmatic, production-tested** approach to building extensible web applications. By combining manifest-based discovery, dependency injection, topological sorting, and type-safe contracts, it achieves a balance between flexibility and correctness.

The architecture's key strengths - explicit dependencies, lifecycle coordination, and type safety - enable hundreds of plugins to coexist and interact reliably. Its trade-offs - no isolation, serial loading, trust-based security - are conscious decisions prioritizing performance and simplicity for a first-party codebase.

For architects building plugin systems, Kibana offers several transferable lessons:

1. **Declarative Manifests** enable static analysis and tooling
2. **Dependency Injection** beats service locator for type safety
3. **Topological Sorting** is essential for correct initialization
4. **Lifecycle Phases** (setup/start/stop) clarify plugin responsibilities
5. **Type-Safe Contracts** prevent integration errors at compile time

As web applications grow in complexity, plugin architectures like Kibana's provide a proven path from monolith to modular system while maintaining the coherence of a unified platform.
