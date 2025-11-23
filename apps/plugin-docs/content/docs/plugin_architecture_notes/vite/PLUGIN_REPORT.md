# Vite Plugin Architecture Analysis

**Version Analyzed:** Vite 7.2.4
**Analysis Date:** 2025-11-22

---

## 1. High-Level Summary

### Architecture Type
Vite implements a **hybrid plugin architecture** combining:
- **Interface-driven contracts** (extending Rollup's plugin interface)
- **Hook-based execution pipeline** (sequential and parallel hook invocation)
- **Registry-based management** (PluginContainer orchestrates plugin lifecycle)
- **Environment-aware multi-pipeline system** (per-environment plugin instances)

### Problem Solved
The plugin system solves several critical problems:

1. **Extensibility**: Allows third-party developers to extend Vite's build and dev capabilities without modifying core code
2. **Rollup Compatibility**: Maintains compatibility with Rollup's vast plugin ecosystem while adding Vite-specific capabilities
3. **Dev/Build Parity**: Provides unified plugin API across development (unbundled ESM) and build (bundled) modes
4. **Multi-Environment Support**: Enables different plugin configurations for client, SSR, and custom environments
5. **Selective Processing**: Advanced filtering system allows plugins to process only relevant files, improving performance
6. **Lifecycle Management**: Structured phases for initialization, transformation, HMR, and cleanup

---

## 2. Plugin Discovery & Loading

### Discovery Mechanisms

**User Plugin Discovery** (`config.ts:1115-1119`):
```typescript
const rawPlugins = (await asyncFlatten(config.plugins || [])).filter(filterPlugin)
const [prePlugins, normalPlugins, postPlugins] = sortUserPlugins(rawPlugins)
```

**Location**: Plugins are discovered from the user's Vite configuration file (`vite.config.ts`):
```typescript
export default {
  plugins: [
    myPlugin(),
    // ... more plugins
  ]
}
```

**Discovery Process**:
1. Configuration file is loaded via `loadConfigFromFile()`
2. Plugins array is flattened (supports nested arrays)
3. Plugins are filtered by `apply` property (serve/build conditional)
4. Plugins are categorized by `enforce` property into pre/normal/post

**Plugin Categorization** (`config.ts:1794-1809`):
```typescript
export function sortUserPlugins(
  plugins: (Plugin | Plugin[])[] | undefined,
): [Plugin[], Plugin[], Plugin[]] {
  const prePlugins: Plugin[] = []
  const postPlugins: Plugin[] = []
  const normalPlugins: Plugin[] = []

  if (plugins) {
    plugins.flat().forEach((p) => {
      if (p.enforce === 'pre') prePlugins.push(p)
      else if (p.enforce === 'post') postPlugins.push(p)
      else normalPlugins.push(p)
    })
  }

  return [prePlugins, normalPlugins, postPlugins]
}
```

### Loading Mechanism

**Built-in Plugin Assembly** (`plugins/index.ts:32-102`):
```typescript
export async function resolvePlugins(
  config: ResolvedConfig,
  prePlugins: Plugin[],
  normalPlugins: Plugin[],
  postPlugins: Plugin[],
): Promise<Plugin[]> {
  const isBuild = config.command === 'build'
  const isWorker = config.isWorker
  const buildPlugins = isBuild
    ? await (await import('../build')).resolveBuildPlugins(config)
    : { pre: [], post: [] }

  return [
    !isBuild ? optimizedDepsPlugin() : null,
    isBuild ? metadataPlugin() : null,
    // ... built-in plugins
    aliasPlugin({ entries: config.resolve.alias }),
    ...prePlugins,           // User pre plugins
    resolvePlugin(/* ... */),
    cssPlugin(config),
    esbuildPlugin(config),
    jsonPlugin(config.json, isBuild),
    assetPlugin(config),
    ...normalPlugins,        // User normal plugins
    definePlugin(config),
    ...buildPlugins.pre,
    ...postPlugins,          // User post plugins
    ...buildPlugins.post,
    // Dev-only plugins
    ...(isBuild ? [] : [
      clientInjectionsPlugin(config),
      importAnalysisPlugin(config),
    ]),
  ].filter(Boolean) as Plugin[]
}
```

**Plugin Execution Order**:
1. Built-in pre-processing plugins (optimizedDeps, metadata, alias)
2. **User `enforce: 'pre'` plugins**
3. Core Vite plugins (resolve, CSS, esbuild, JSON, assets)
4. **User normal plugins** (no enforce property)
5. Built-in transformation plugins (define)
6. Build-specific plugins (if building)
7. **User `enforce: 'post'` plugins**
8. Build post-processing plugins
9. Dev-only plugins (clientInjections, importAnalysis)

**Per-Environment Plugin Resolution** (`plugin.ts:354-376`):
```typescript
export async function resolveEnvironmentPlugins(
  environment: PartialEnvironment,
): Promise<Plugin[]> {
  const environmentPlugins: Plugin[] = []
  for (const plugin of environment.getTopLevelConfig().plugins) {
    if (plugin.applyToEnvironment) {
      const applied = await plugin.applyToEnvironment(environment)
      if (!applied) continue
      if (applied !== true) {
        environmentPlugins.push(
          ...((await asyncFlatten(arraify(applied))).filter(Boolean) as Plugin[]),
        )
        continue
      }
    }
    environmentPlugins.push(plugin)
  }
  return environmentPlugins
}
```

### Responsible Files
- **`packages/vite/src/node/config.ts`**: Configuration loading and plugin discovery
- **`packages/vite/src/node/plugins/index.ts`**: Plugin resolution and assembly
- **`packages/vite/src/node/plugin.ts`**: Plugin types and environment resolution
- **`packages/vite/src/node/server/pluginContainer.ts`**: Runtime plugin container

---

## 3. Plugin Registration

### Registry Object

**EnvironmentPluginContainer** (`server/pluginContainer.ts:172-214`):
```typescript
class EnvironmentPluginContainer<Env extends Environment = Environment> {
  private _pluginContextMap = new Map<Plugin, PluginContext>()
  private _resolvedRollupOptions?: InputOptions

  getSortedPluginHooks: PluginHookUtils['getSortedPluginHooks']
  getSortedPlugins: PluginHookUtils['getSortedPlugins']

  constructor(
    public environment: Env,
    public plugins: readonly Plugin[],
    public watcher?: FSWatcher | undefined,
    autoStart = true,
  ) {
    this.minimalContext = new MinimalPluginContext(
      { ...basePluginContextMeta, watchMode: true },
      environment,
    )
    const utils = createPluginHookUtils(plugins)
    this.getSortedPlugins = utils.getSortedPlugins
    this.getSortedPluginHooks = utils.getSortedPluginHooks
    this.moduleGraph = environment.mode === 'dev'
      ? environment.moduleGraph
      : undefined
  }
}
```

The container:
- Manages plugin lifecycle
- Caches plugin contexts (one per plugin)
- Provides sorted hook access
- Tracks module graph and watch files
- Coordinates hook execution

### Hook Registration Pattern

**Hook Sorting Utility** (`plugins/index.ts:104-129`):
```typescript
export function createPluginHookUtils(
  plugins: readonly Plugin[],
): PluginHookUtils {
  const sortedPluginsCache = new Map<keyof Plugin, Plugin[]>()

  function getSortedPlugins<K extends keyof Plugin>(
    hookName: K,
  ): PluginWithRequiredHook<K>[] {
    if (sortedPluginsCache.has(hookName))
      return sortedPluginsCache.get(hookName) as PluginWithRequiredHook<K>[]
    const sorted = getSortedPluginsByHook(hookName, plugins)
    sortedPluginsCache.set(hookName, sorted)
    return sorted
  }

  function getSortedPluginHooks<K extends keyof Plugin>(
    hookName: K,
  ): NonNullable<HookHandler<Plugin[K]>>[] {
    const plugins = getSortedPlugins(hookName)
    return plugins.map((p) => getHookHandler(p[hookName])).filter(Boolean)
  }

  return { getSortedPlugins, getSortedPluginHooks }
}
```

**Per-Hook Sorting** (`plugins/index.ts:131-159`):
```typescript
export function getSortedPluginsByHook<K extends keyof Plugin>(
  hookName: K,
  plugins: readonly Plugin[],
): PluginWithRequiredHook<K>[] {
  const sortedPlugins: Plugin[] = []
  let pre = 0, normal = 0, post = 0

  for (const plugin of plugins) {
    const hook = plugin[hookName]
    if (hook) {
      if (typeof hook === 'object') {
        if (hook.order === 'pre') {
          sortedPlugins.splice(pre++, 0, plugin)
          continue
        }
        if (hook.order === 'post') {
          sortedPlugins.splice(pre + normal + post++, 0, plugin)
          continue
        }
      }
      sortedPlugins.splice(pre + normal++, 0, plugin)
    }
  }
  return sortedPlugins as PluginWithRequiredHook<K>[]
}
```

Hooks can have individual ordering via `order` property:
```typescript
{
  transform: {
    order: 'pre', // or 'post'
    handler(code, id) { /* ... */ }
  }
}
```

### Base Interface

**Plugin Interface** (`plugin.ts:94-340`):
```typescript
export interface Plugin<A = any> extends RollupPlugin<A> {
  // Metadata
  name?: string
  enforce?: 'pre' | 'post'
  apply?: 'serve' | 'build' | ((config: UserConfig, env: ConfigEnv) => boolean)

  // Vite-specific hooks
  config?: ObjectHook<(config: UserConfig, env: ConfigEnv) => UserConfig | void>
  configEnvironment?: ObjectHook<(name: string, config: EnvironmentOptions, env: ConfigEnv) => EnvironmentOptions | void>
  configResolved?: ObjectHook<(config: ResolvedConfig) => void>
  configureServer?: ObjectHook<ServerHook>
  configurePreviewServer?: ObjectHook<PreviewServerHook>
  transformIndexHtml?: IndexHtmlTransform
  hotUpdate?: ObjectHook<(options: HotUpdateOptions) => Array<EnvironmentModuleNode> | void>

  // Enhanced Rollup hooks with filters
  resolveId?: ObjectHook<
    (source: string, importer?: string, options?: {...}) => ResolveIdResult,
    { filter?: { id?: StringFilter<RegExp> } }
  >
  load?: ObjectHook<
    (id: string, options?: {...}) => LoadResult,
    { filter?: { id?: StringFilter } }
  >
  transform?: ObjectHook<
    (code: string, id: string, options?: {...}) => TransformResult,
    { filter?: { id?: StringFilter; code?: StringFilter } }
  >

  // Environment control
  applyToEnvironment?: (environment: PartialEnvironment) => boolean | PluginOption
  sharedDuringBuild?: boolean
  perEnvironmentStartEndDuringDev?: boolean
  perEnvironmentWatchChangeDuringDev?: boolean
}
```

### Naming Conventions
- Built-in plugins prefixed with `vite:` (e.g., `vite:json`, `vite:css`, `vite:resolve`)
- Community convention: scope prefix (e.g., `@vitejs/plugin-react`, `vite-plugin-vue`)

---

## 4. Plugin Interface / Contract

### Required Properties
```typescript
{
  name: string  // REQUIRED: Unique plugin identifier
}
```

### Optional Control Properties
```typescript
{
  enforce?: 'pre' | 'post',         // Execution order tier
  apply?: 'serve' | 'build' | fn,   // Conditional application
  applyToEnvironment?: fn,          // Per-environment activation
  sharedDuringBuild?: boolean,      // Share instance across environments
  perEnvironmentStartEndDuringDev?: boolean,
  perEnvironmentWatchChangeDuringDev?: boolean,
}
```

### Hook Categories

#### **1. Configuration Hooks** (Global, no `this.environment`)
```typescript
{
  config(config: UserConfig, env: ConfigEnv): UserConfig | void
  configEnvironment(name: string, config: EnvironmentOptions, env: ConfigEnv): EnvironmentOptions | void
  configResolved(config: ResolvedConfig): void
  configureServer(server: ViteDevServer): (() => void) | void
  configurePreviewServer(server: PreviewServer): (() => void) | void
}
```

#### **2. Module Resolution Hooks** (with environment context)
```typescript
{
  resolveId: {
    filter?: { id?: StringFilter<RegExp> },
    handler(source: string, importer?: string, options?: {
      attributes: Record<string, string>
      custom?: CustomPluginOptions
      ssr?: boolean
      scan?: boolean
      isEntry: boolean
    }): ResolveIdResult | Promise<ResolveIdResult>
  }
}
```

#### **3. Loading Hooks**
```typescript
{
  load: {
    filter?: { id?: StringFilter },
    handler(id: string, options?: { ssr?: boolean }): LoadResult | Promise<LoadResult>
  }
}
```

#### **4. Transformation Hooks**
```typescript
{
  transform: {
    filter?: { id?: StringFilter; code?: StringFilter },
    handler(code: string, id: string, options?: { ssr?: boolean }): TransformResult | Promise<TransformResult>
  }
}
```

#### **5. Build Lifecycle Hooks**
```typescript
{
  buildStart(options: InputOptions): void
  buildEnd(error?: Error): void
  closeBundle(): void
}
```

#### **6. HMR Hooks**
```typescript
{
  hotUpdate(options: HotUpdateOptions): Array<EnvironmentModuleNode> | void
  handleHotUpdate(ctx: HmrContext): Array<ModuleNode> | void  // Legacy
}
```

#### **7. HTML Transform Hook**
```typescript
{
  transformIndexHtml: {
    order?: 'pre' | 'post',
    handler(html: string, ctx: IndexHtmlTransformContext):
      string | HtmlTagDescriptor[] | { html: string, tags: HtmlTagDescriptor[] }
  }
}
```

#### **8. Watch Hooks**
```typescript
{
  watchChange(id: string, change: { event: 'create' | 'update' | 'delete' }): void
}
```

### Hook Handler Formats

**Simple Function**:
```typescript
{
  name: 'my-plugin',
  transform(code, id) {
    return { code: transformedCode }
  }
}
```

**ObjectHook with Options**:
```typescript
{
  name: 'my-plugin',
  transform: {
    order: 'pre',
    filter: {
      id: '**/*.vue',
      code: /import.*vue/
    },
    handler(code, id) {
      return { code: transformedCode }
    }
  }
}
```

### Filter Patterns (`plugins/pluginFilter.ts`)

**StringFilter Type**:
```typescript
type StringFilter<Value = string | RegExp> =
  | Value                          // Single pattern
  | Array<Value>                   // Array of patterns
  | {                              // Include/exclude object
      include?: Value | Array<Value>
      exclude?: Value | Array<Value>
    }
```

**Examples**:
```typescript
// Glob pattern
filter: { id: '**/*.json' }

// Regex
filter: { id: /\.json$/ }

// Array
filter: { id: ['**/*.json', '**/*.json5'] }

// Include/exclude
filter: {
  id: {
    include: '**/*.vue',
    exclude: '**/node_modules/**'
  }
}

// Code content filter
filter: {
  code: 'import.meta.hot'  // String literal search
}
```

### Expected Return Types

**resolveId**:
```typescript
// String (resolved ID)
return '/absolute/path/to/module.js'

// Object with metadata
return {
  id: '/absolute/path/to/module.js',
  external: false,
  meta: { /* custom metadata */ }
}

// null (not handled, try next plugin)
return null
```

**load**:
```typescript
// String (source code)
return 'export default { ... }'

// Object with metadata
return {
  code: 'export default { ... }',
  map: sourceMap,
  meta: { /* custom metadata */ }
}

// null (not handled)
return null
```

**transform**:
```typescript
// String (transformed code)
return transformedCode

// Object with sourcemap
return {
  code: transformedCode,
  map: sourceMap,
  meta: { /* custom metadata */ }
}

// null (no transformation)
return null
```

### Context API Available in Hooks

**All Non-Global Hooks**:
```typescript
this.environment    // Current environment (dev/build/scan)
this.meta.viteVersion
this.meta.rollupVersion
this.meta.watchMode
```

**resolve/load/transform Hooks**:
```typescript
this.resolve(id, importer?, options?)
this.load(options)
this.getModuleInfo(id)
this.addWatchFile(id)
this.getWatchFiles()
this.parse(code, opts)
this.error(err | message, pos?)
this.warn(message, pos?)
```

**transform Hook Only**:
```typescript
this.getCombinedSourcemap()  // Combined sourcemap from chain
```

---

## 5. Plugin Lifecycle

### Development Mode Lifecycle

```
1. Configuration Phase (no environment context)
   ├─> config hook                    // Modify config before resolution
   ├─> Plugin filtering (apply check) // Filter by serve/build
   ├─> configEnvironment hook         // Modify per-environment config
   ├─> configResolved hook            // Store final resolved config
   └─> configureServer hook           // Setup dev server

2. Server Initialization
   ├─> PluginContainer creation       // Per-environment containers
   ├─> options hook (Rollup)          // Process Rollup options
   └─> buildStart hook (once or per-env)

3. Module Processing (on-demand, per request)
   ├─> resolveId hook                 // Module ID resolution (hookFirst)
   ├─> load hook                      // Load module content (hookFirst)
   └─> transform hook                 // Transform code (sequential chain)

4. Hot Module Replacement (on file change)
   ├─> watchChange hook (if configured)
   ├─> Module invalidation
   ├─> hotUpdate hook                 // Custom HMR handling
   └─> HMR update sent to client

5. Server Shutdown
   ├─> buildEnd hook (if configured)
   └─> closeBundle hook
```

**Code Reference** (`server/pluginContainer.ts:325-347`):
```typescript
async buildStart(_options?: InputOptions): Promise<void> {
  if (this._started) {
    if (this._buildStartPromise) await this._buildStartPromise
    return
  }
  this._started = true
  const config = this.environment.getTopLevelConfig()
  this._buildStartPromise = this.handleHookPromise(
    this.hookParallel(
      'buildStart',
      (plugin) => this._getPluginContext(plugin),
      () => [this.options as NormalizedInputOptions],
      (plugin) =>
        this.environment.name === 'client' ||
        config.server.perEnvironmentStartEndDuringDev ||
        plugin.perEnvironmentStartEndDuringDev,
    ),
  ) as Promise<void>
  await this._buildStartPromise
}
```

### Build Mode Lifecycle

```
1. Configuration Phase
   ├─> config hook
   ├─> Plugin filtering (apply check)
   ├─> configEnvironment hook
   └─> configResolved hook

2. Build Initialization (per environment)
   ├─> PluginContainer creation
   ├─> options hook
   └─> buildStart hook

3. Module Graph Construction
   ├─> resolveId hook (for all imports)
   ├─> load hook (for all modules)
   └─> transform hook (sequential per module)

4. Bundle Generation (Rollup output phase)
   ├─> resolveFileUrl hook
   ├─> resolveImportMeta hook
   ├─> renderChunk hook
   ├─> augmentChunkHash hook
   ├─> generateBundle hook
   └─> writeBundle hook

5. HTML Processing
   └─> transformIndexHtml hook

6. Build Completion
   ├─> buildEnd hook
   └─> closeBundle hook
```

### Hook Execution Strategies

**hookFirst (sequential, first result wins)**:
```typescript
// Used by: resolveId, load
for (const plugin of this.getSortedPlugins(hookName)) {
  const result = await handler.call(ctx, ...args)
  if (result != null) {
    return result  // First non-null result wins
  }
}
```

**hookSeq (sequential chain)**:
```typescript
// Used by: transform
for (const plugin of this.getSortedPlugins('transform')) {
  const result = await handler.call(ctx, code, id, options)
  if (result) {
    code = result.code
    if (result.map) {
      ctx.sourcemapChain.push(result.map)
    }
  }
}
return { code, map: combinedMap }
```

**hookParallel (parallel execution)**:
```typescript
// Used by: buildStart, buildEnd, closeBundle, watchChange
const parallelPromises: Promise<unknown>[] = []
for (const plugin of this.getSortedPlugins(hookName)) {
  const hook = plugin[hookName]
  const handler = getHookHandler(hook)
  if (hook.sequential) {
    await Promise.all(parallelPromises)
    parallelPromises.length = 0
    await handler.apply(context(plugin), args(plugin))
  } else {
    parallelPromises.push(handler.apply(context(plugin), args(plugin)))
  }
}
await Promise.all(parallelPromises)
```

### Per-Environment Lifecycle Control

**Default Behavior (backward compatibility)**:
- `buildStart`: Called once for client environment only (dev mode)
- `buildEnd`: Called once for client environment only (dev mode)
- `watchChange`: Called once for client environment only (dev mode)

**Opt-in Per-Environment Behavior**:
```typescript
{
  name: 'my-plugin',
  perEnvironmentStartEndDuringDev: true,    // buildStart/buildEnd per env
  perEnvironmentWatchChangeDuringDev: true, // watchChange per env

  buildStart(options) {
    // Called for each environment
    console.log(this.environment.name)  // 'client', 'ssr', etc.
  }
}
```

---

## 6. Extension Points

### Core Extension Points

#### **1. Module Resolution** (`resolveId`)
- **Purpose**: Resolve bare imports, aliases, virtual modules
- **Binding**: Return non-null result
- **Execution**: hookFirst (first non-null wins)
- **Example Use Cases**:
  - Alias resolution
  - Virtual module injection
  - Node module resolution
  - Conditional resolution (dev/build, client/SSR)

**Code Reference** (`server/pluginContainer.ts:349-471`):
```typescript
async resolveId(
  rawId: string,
  importer?: string,
  options?: { ... }
): Promise<PartialResolvedId | null> {
  const ctx = new ResolveIdContext(this, skip, skipCalls, scan)

  for (const plugin of this.getSortedPlugins('resolveId')) {
    const filter = getCachedFilterForPlugin(plugin, 'resolveId')
    if (filter && !filter(rawId)) continue

    const handler = getHookHandler(plugin.resolveId)
    const result = await this.handleHookPromise(
      handler.call(ctx as any, rawId, importer, normalizedOptions),
    )
    if (!result) continue

    // First non-null result wins
    if (typeof result === 'string') {
      id = result
    } else {
      id = result.id
      Object.assign(partial, result)
    }
    break
  }

  return id ? partial as PartialResolvedId : null
}
```

#### **2. Module Loading** (`load`)
- **Purpose**: Load module source code
- **Binding**: Return code string or LoadResult
- **Execution**: hookFirst
- **Example Use Cases**:
  - Virtual module content
  - Transform file formats (JSON, YAML, etc.)
  - Proxy modules

#### **3. Code Transformation** (`transform`)
- **Purpose**: Transform module code (transpilation, preprocessing)
- **Binding**: Return transformed code + sourcemap
- **Execution**: Sequential chain (all plugins run)
- **Example Use Cases**:
  - JSX/TSX transpilation (esbuild)
  - CSS preprocessing (Sass, Less, PostCSS)
  - Code injection (HMR, env variables)
  - Import analysis

**Code Reference** (`server/pluginContainer.ts:524-599`):
```typescript
async transform(
  code: string,
  id: string,
  options?: { inMap?: SourceMap }
): Promise<{ code: string; map: SourceMap | null }> {
  const ctx = new TransformPluginContext(this, id, code, inMap)

  for (const plugin of this.getSortedPlugins('transform')) {
    const filter = getCachedFilterForPlugin(plugin, 'transform')
    if (filter && !filter(id, code)) continue

    ctx._updateActiveInfo(plugin, id, code)
    const handler = getHookHandler(plugin.transform)
    const result = await this.handleHookPromise(
      handler.call(ctx as any, code, id, optionsWithSSR),
    )

    if (!result) continue

    if (isObject(result)) {
      if (result.code !== undefined) {
        code = result.code
        if (result.map) {
          ctx.sourcemapChain.push(result.map)
        }
      }
      ctx._updateModuleInfo(id, result)
    } else {
      code = result
    }
  }

  return {
    code,
    map: ctx.getCombinedSourcemap()
  }
}
```

#### **4. Configuration Modification** (`config`)
- **Purpose**: Modify Vite config before resolution
- **Binding**: Return partial config or mutate in place
- **Execution**: Sequential
- **Example Use Cases**:
  - Add aliases
  - Configure optimizeDeps
  - Add environment variables

#### **5. Server Middleware** (`configureServer`)
- **Purpose**: Add custom dev server middleware
- **Binding**: Optionally return post-middleware function
- **Execution**: Sequential (pre-middleware, then post-middleware)
- **Example Use Cases**:
  - Custom API routes
  - Proxy setup
  - WebSocket handlers

#### **6. HTML Transformation** (`transformIndexHtml`)
- **Purpose**: Transform HTML content or inject tags
- **Binding**: Return HTML string or tag descriptors
- **Execution**: Sequential (order: 'pre' | default | 'post')
- **Example Use Cases**:
  - Script/style injection
  - Meta tag manipulation
  - HTML preprocessing

#### **7. HMR Customization** (`hotUpdate`)
- **Purpose**: Custom hot module replacement logic
- **Binding**: Return filtered module list or empty array (custom handling)
- **Execution**: Sequential
- **Example Use Cases**:
  - Framework-specific HMR (Vue SFC, React Fast Refresh)
  - State preservation
  - Partial updates

#### **8. File Watching** (`watchChange`)
- **Purpose**: React to file system changes
- **Binding**: No return value (side effects only)
- **Execution**: Parallel (or sequential if `sequential: true`)
- **Example Use Cases**:
  - Cache invalidation
  - External file monitoring
  - Config reloading

### Built-in Plugins Demonstrating Extension Points

| Plugin | Extension Points Used | Purpose |
|--------|----------------------|---------|
| `vite:resolve` | resolveId | Node module resolution, aliases |
| `vite:json` | transform (with filter) | JSON to ESM conversion |
| `vite:css` | resolveId, transform | CSS preprocessing, modules |
| `vite:esbuild` | transform | JSX/TSX/TS transpilation |
| `vite:asset` | resolveId, load | Static asset handling |
| `vite:html` | transformIndexHtml | HTML processing, script injection |
| `vite:import-analysis` | transform | Import rewriting, HMR injection |
| `vite:define` | transform | Global constant replacement |

---

## 7. Configuration & Metadata

### Plugin Configuration

**User Configuration** (`vite.config.ts`):
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      // Plugin-specific options
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('my-')
        }
      }
    })
  ]
})
```

**Factory Function Pattern**:
```typescript
export function myPlugin(options: MyPluginOptions = {}): Plugin {
  return {
    name: 'my-plugin',

    configResolved(config) {
      // Store config for use in other hooks
      this._config = config
    },

    transform(code, id) {
      // Use stored config and plugin options
      if (options.enabled && this._config.isProduction) {
        return transformCode(code, options)
      }
    }
  }
}
```

**Conditional Application**:
```typescript
{
  name: 'build-only-plugin',
  apply: 'build',  // Only in build mode
  // ...
}

{
  name: 'conditional-plugin',
  apply(config, { command, mode }) {
    return command === 'serve' && mode === 'development'
  },
  // ...
}
```

**Per-Environment Application**:
```typescript
{
  name: 'ssr-only-plugin',
  applyToEnvironment(environment) {
    return environment.name === 'ssr'
  },
  // ...
}

{
  name: 'dynamic-env-plugin',
  async applyToEnvironment(environment) {
    if (environment.config.consumer === 'server') {
      // Return different plugin for SSR
      return ssrSpecificPlugin()
    }
    return true  // Apply this plugin
  }
}
```

### Metadata Storage

**Plugin-Level Metadata** (`configResolved` hook):
```typescript
{
  name: 'my-plugin',

  configResolved(config) {
    // Store config reference
    this._resolvedConfig = config

    // Initialize plugin state
    this._cache = new Map()
  },

  transform(code, id) {
    // Access stored metadata
    if (this._resolvedConfig.isProduction) {
      // ...
    }
  }
}
```

**Module-Level Metadata** (via `meta` property):
```typescript
{
  load(id) {
    return {
      code: '...',
      meta: {
        'my-plugin': {
          customData: 'value'
        }
      }
    }
  },

  transform(code, id) {
    const info = this.getModuleInfo(id)
    const myData = info?.meta?.['my-plugin']
    // Access metadata from load hook
  }
}
```

**Context Metadata**:
```typescript
{
  buildStart() {
    console.log(this.meta.viteVersion)    // "7.2.4"
    console.log(this.meta.rollupVersion)  // "4.x.x"
    console.log(this.meta.watchMode)      // true in dev
  }
}
```

### Hot Reload Capability

**No Built-in Plugin Hot Reload**: Vite does not support hot-reloading plugins themselves. Plugin changes require server restart.

**Config File Changes**:
- Detected automatically
- Server restart triggered
- Message: `"config file changed, restarting server..."`

**Workaround for Development**:
```typescript
// In plugin code
if (config.command === 'serve') {
  // Watch external config file
  const watcher = chokidar.watch('./my-plugin-config.json')
  watcher.on('change', () => {
    // Invalidate caches, reload config
    this._cache.clear()
    this._loadConfig()
  })
}
```

---

## 8. Security, Isolation & Error Handling

### Sandboxing & Isolation

**No Process-Level Sandboxing**: Plugins run in the same Node.js process as Vite. They have full system access.

**Environment Isolation**:
- Each environment (client, SSR, custom) has its own `PluginContainer` instance
- Plugin instances can be shared or separate based on `sharedDuringBuild`
- Module graphs are isolated per environment

**Context Isolation**:
```typescript
// Each plugin gets its own context instance
private _getPluginContext(plugin: Plugin) {
  if (!this._pluginContextMap.has(plugin)) {
    this._pluginContextMap.set(plugin, new PluginContext(plugin, this))
  }
  return this._pluginContextMap.get(plugin)!
}
```

### Plugin Validation

**Minimal Validation**:
- Plugin name required (implicitly, for debugging)
- Hook type checking (TypeScript compile-time only)
- No runtime schema validation
- No permission system

**Filter Validation**:
```typescript
// Filter compilation happens lazily and is cached
export function getCachedFilterForPlugin<H extends 'resolveId' | 'load' | 'transform'>(
  plugin: Plugin,
  hookName: H
): FilterForPluginValue[H] | undefined {
  let filters = filterForPlugin.get(plugin)
  if (filters && hookName in filters) {
    return filters[hookName]
  }

  // Extract and compile filter
  const rawFilter = extractFilter(plugin[hookName])
  filters[hookName] = createIdFilter(rawFilter?.id) // May throw on invalid pattern
  return filters[hookName]
}
```

### Error Handling

**Hook Error Handling** (`server/pluginContainer.ts`):
```typescript
try {
  result = await this.handleHookPromise(
    handler.call(ctx as any, code, id, options),
  )
} catch (e) {
  ctx.error(e)  // Formats and throws with context
}
```

**Error Formatting**:
```typescript
// Plugin context provides error() and warn()
this.error(err, pos) {
  // Adds code frame, plugin name, and position info
  throw buildErrorMessage(
    err,
    [this._activePlugin.name],
    this._activeCode,
    this._activeId,
    pos
  )
}
```

**Server Restart on Fatal Errors**:
- Server can be configured with `dev.recoverable: true`
- Closed server errors throw `ERR_CLOSED_SERVER`
- Caught by middleware, returns 504 timeout

**Plugin Failure Isolation**:
- **Config phase**: Fatal error, server fails to start
- **Transform phase**: Error thrown to client, request fails
- **HMR phase**: Error logged, HMR update fails gracefully

### Security Considerations

**Risks**:
1. **Arbitrary Code Execution**: Plugins can execute any Node.js code
2. **File System Access**: Full read/write access
3. **Network Access**: Can make external requests
4. **Process Control**: Can spawn child processes
5. **Dependency Injection**: Can modify module resolution

**Mitigations**:
1. **Trust Model**: Only use plugins from trusted sources
2. **Code Review**: Review plugin source before using
3. **Lockfile**: Pin plugin versions in package.json
4. **Scoped Packages**: Prefer `@org/plugin-name` from known orgs
5. **Minimal Plugins**: Use only necessary plugins

**No CSP for Plugins**: Content Security Policy applies to browser, not Node.js plugins

---

## 9. Dependency Management

### Plugin Dependencies

**Implicit Dependencies** (most common):
```typescript
// Plugin factory function receives config
export function myPlugin(options = {}): Plugin {
  let config: ResolvedConfig

  return {
    name: 'my-plugin',

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    transform(code, id) {
      // Use config from closure
      if (config.isProduction) {
        // ...
      }
    }
  }
}
```

**Context-Based Dependencies**:
```typescript
{
  transform(code, id) {
    // Access environment
    const isDev = this.environment.mode === 'dev'
    const isSSR = this.environment.config.consumer === 'server'

    // Resolve other modules
    const resolved = await this.resolve('./helper', id)

    // Load other modules
    const helperInfo = await this.load({ id: resolved.id })
  }
}
```

**Service Locator Pattern** (via config):
```typescript
{
  configResolved(config) {
    // Access Vite's internal services via config
    this._logger = config.logger
    this._packageCache = config.packageCache
  }
}
```

**External Package Dependencies**:
```typescript
// package.json
{
  "name": "vite-plugin-example",
  "peerDependencies": {
    "vite": "^7.0.0"
  },
  "dependencies": {
    "some-library": "^1.0.0"
  }
}
```

### Dependency Injection

**No DI Container**: Vite does not use a formal DI container. Dependencies are:
1. Passed via constructor (plugin factory options)
2. Accessed via context (`this.environment`, `this.resolve`, etc.)
3. Stored in closure during `configResolved`

**Inter-Plugin Communication**:

**Via Module Metadata**:
```typescript
// Plugin A
{
  load(id) {
    return {
      code: '...',
      meta: {
        'plugin-a': { processed: true }
      }
    }
  }
}

// Plugin B
{
  transform(code, id) {
    const info = this.getModuleInfo(id)
    if (info?.meta?.['plugin-a']?.processed) {
      // Plugin A already processed this
    }
  }
}
```

**Via Config Extension**:
```typescript
// Plugin A extends config
{
  config() {
    return {
      __pluginAState: {
        // Shared state
      }
    }
  }
}

// Plugin B reads extended config
{
  configResolved(config) {
    const sharedState = config.__pluginAState
  }
}
```

**Via Virtual Modules**:
```typescript
// Plugin A provides virtual module
{
  resolveId(id) {
    if (id === 'virtual:plugin-a-api') return id
  },
  load(id) {
    if (id === 'virtual:plugin-a-api') {
      return 'export const api = ...'
    }
  }
}

// Plugin B or user code imports it
import { api } from 'virtual:plugin-a-api'
```

### Version Constraints

**No Built-in Version Checking**: Vite does not enforce plugin version compatibility.

**Peer Dependencies** (npm/pnpm enforced):
```json
{
  "peerDependencies": {
    "vite": "^7.0.0"
  }
}
```

**Runtime Version Check** (plugin can implement):
```typescript
{
  configResolved(config) {
    const viteVersion = this.meta.viteVersion
    if (!semver.satisfies(viteVersion, '>=7.0.0')) {
      throw new Error(`This plugin requires Vite 7.0.0 or higher`)
    }
  }
}
```

**API Feature Detection** (preferred):
```typescript
{
  configResolved(config) {
    // Check if new API exists
    if (!config.environments) {
      this._useOldAPI = true
    }
  }
}
```

---

## 10. Architecture Diagram

### System-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vite Configuration                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  vite.config.ts                                           │  │
│  │  ├─ plugins: [userPluginA(), userPluginB(), ...]         │  │
│  │  ├─ environments: { client: {...}, ssr: {...} }          │  │
│  │  └─ build, server, preview options                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Configuration Resolution                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  resolveConfig (config.ts)                                │  │
│  │  1. Load config file                                      │  │
│  │  2. Filter plugins by 'apply' (serve/build)              │  │
│  │  3. Sort plugins: sortUserPlugins()                      │  │
│  │     ├─ prePlugins (enforce: 'pre')                       │  │
│  │     ├─ normalPlugins (no enforce)                        │  │
│  │     └─ postPlugins (enforce: 'post')                     │  │
│  │  4. Run config hooks on all plugins                      │  │
│  │  5. Run configEnvironment hooks per environment          │  │
│  │  6. Run configResolved hooks                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Plugin Resolution                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  resolvePlugins (plugins/index.ts)                        │  │
│  │  Assembles final plugin array in execution order:        │  │
│  │                                                            │  │
│  │  [                                                         │  │
│  │    optimizedDepsPlugin (serve),                          │  │
│  │    metadataPlugin (build),                               │  │
│  │    aliasPlugin,                                          │  │
│  │    ...prePlugins,              ◄── User plugins          │  │
│  │    resolvePlugin,                                        │  │
│  │    cssPlugin,                                            │  │
│  │    esbuildPlugin,                                        │  │
│  │    jsonPlugin,                                           │  │
│  │    assetPlugin,                                          │  │
│  │    ...normalPlugins,           ◄── User plugins          │  │
│  │    definePlugin,                                         │  │
│  │    buildPlugins.pre,                                     │  │
│  │    ...postPlugins,             ◄── User plugins          │  │
│  │    buildPlugins.post,                                    │  │
│  │    importAnalysisPlugin (serve)                          │  │
│  │  ]                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Per-Environment Plugin Resolution               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  resolveEnvironmentPlugins (plugin.ts)                    │  │
│  │                                                            │  │
│  │  For each environment (client, ssr, custom):             │  │
│  │  ├─ Check plugin.applyToEnvironment(env)                 │  │
│  │  ├─ If false: skip plugin                                │  │
│  │  ├─ If true: include plugin                              │  │
│  │  └─ If plugin: substitute with returned plugin(s)        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Environment Plugin Containers (1 per env)           │
│                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────┐        │
│  │  Client Environment    │  │  SSR Environment       │  ...   │
│  │  ┌──────────────────┐  │  │  ┌──────────────────┐  │        │
│  │  │ PluginContainer  │  │  │  │ PluginContainer  │  │        │
│  │  │                  │  │  │  │                  │  │        │
│  │  │ • plugins[]      │  │  │  │ • plugins[]      │  │        │
│  │  │ • hookUtils      │  │  │  │ • hookUtils      │  │        │
│  │  │ • moduleGraph    │  │  │  │ • moduleGraph    │  │        │
│  │  │ • watchFiles     │  │  │  │ • watchFiles     │  │        │
│  │  └──────────────────┘  │  │  └──────────────────┘  │        │
│  └────────────────────────┘  └────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Hook Execution Pipeline                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Hook Sorting & Caching (createPluginHookUtils)           │  │
│  │                                                            │  │
│  │  Per hook name, sort plugins by:                         │  │
│  │  1. Hook-level order ('pre' in ObjectHook)               │  │
│  │  2. Maintain plugin-level enforce order                  │  │
│  │                                                            │  │
│  │  Cache sorted plugins per hook name                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Hook Filter Application (getCachedFilterForPlugin)       │  │
│  │                                                            │  │
│  │  For resolveId, load, transform:                         │  │
│  │  1. Extract filter from ObjectHook                       │  │
│  │  2. Compile glob/regex patterns                          │  │
│  │  3. Cache compiled filter per plugin                     │  │
│  │  4. Skip plugin if filter doesn't match                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Hook Execution Strategies                                │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ hookFirst (resolveId, load)                        │  │  │
│  │  │ ───────────────────────────                        │  │  │
│  │  │ for plugin in sortedPlugins:                       │  │  │
│  │  │   result = await plugin.hook(...)                  │  │  │
│  │  │   if result != null: return result  ← First wins   │  │  │
│  │  │ return null                                        │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ hookSeq (transform)                                │  │  │
│  │  │ ───────────────────────────                        │  │  │
│  │  │ for plugin in sortedPlugins:                       │  │  │
│  │  │   result = await plugin.hook(code, ...)            │  │  │
│  │  │   if result:                                       │  │  │
│  │  │     code = result.code                             │  │  │
│  │  │     sourcemapChain.push(result.map)                │  │  │
│  │  │ return { code, map: combined }  ← All run          │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ hookParallel (buildStart, buildEnd, watchChange)   │  │  │
│  │  │ ───────────────────────────                        │  │  │
│  │  │ promises = []                                      │  │  │
│  │  │ for plugin in sortedPlugins:                       │  │  │
│  │  │   if plugin.hook.sequential:                       │  │  │
│  │  │     await Promise.all(promises)                    │  │  │
│  │  │     await plugin.hook(...)                         │  │  │
│  │  │   else:                                            │  │  │
│  │  │     promises.push(plugin.hook(...))                │  │  │
│  │  │ await Promise.all(promises)  ← All complete        │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Plugin Context System                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MinimalPluginContext (base for all hooks)                │  │
│  │  • this.environment (current environment)                 │  │
│  │  • this.meta.viteVersion                                  │  │
│  │  • this.meta.rollupVersion                                │  │
│  │  • this.meta.watchMode                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PluginContext (extends Minimal)                          │  │
│  │  • this.resolve(id, importer, options)                    │  │
│  │  • this.load(options)                                     │  │
│  │  • this.getModuleInfo(id)                                 │  │
│  │  • this.addWatchFile(id)                                  │  │
│  │  • this.getWatchFiles()                                   │  │
│  │  • this.error(err, pos)                                   │  │
│  │  • this.warn(message, pos)                                │  │
│  │  • this.parse(code)                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TransformPluginContext (extends PluginContext)           │  │
│  │  • this.getCombinedSourcemap()                            │  │
│  │  • Manages sourcemap chain                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
┌───────────────┐
│  User Request │  (e.g., GET /src/main.ts)
└───────┬───────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│              Dev Server / Build System                     │
└───────┬───────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│         PluginContainer.resolveId('/src/main.ts')         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  1. Sort plugins by hook + enforce                  │  │
│  │  2. Apply ID filter: if (filter && !filter(id))    │  │
│  │  3. Call plugin.resolveId(id, importer, options)   │  │
│  │  4. Return first non-null result                    │  │
│  │                                                      │  │
│  │  Result: { id: '/abs/path/to/main.ts' }            │  │
│  └─────────────────────────────────────────────────────┘  │
└───────┬───────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│         PluginContainer.load('/abs/path/to/main.ts')      │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  1. Sort plugins                                     │  │
│  │  2. Apply ID filter                                  │  │
│  │  3. Call plugin.load(id, options)                   │  │
│  │  4. Return first non-null { code, map, meta }       │  │
│  │                                                      │  │
│  │  Result: { code: 'import ...', meta: {...} }        │  │
│  └─────────────────────────────────────────────────────┘  │
└───────┬───────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│   PluginContainer.transform(code, '/abs/path/to/main.ts') │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  1. Sort plugins                                     │  │
│  │  2. Apply ID + code filters                          │  │
│  │  3. For each plugin:                                 │  │
│  │     ├─ result = plugin.transform(code, id, opts)    │  │
│  │     ├─ if result.code: code = result.code           │  │
│  │     └─ if result.map: sourcemapChain.push(map)      │  │
│  │  4. Combine sourcemaps                               │  │
│  │                                                      │  │
│  │  Plugins run in sequence:                           │  │
│  │  • esbuildPlugin: TS → JS                           │  │
│  │  • definePlugin: replace constants                  │  │
│  │  • importAnalysisPlugin: rewrite imports for HMR    │  │
│  │                                                      │  │
│  │  Result: { code: transformed, map: combined }       │  │
│  └─────────────────────────────────────────────────────┘  │
└───────┬───────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│              Response to Client                            │
│  • Content-Type: application/javascript                   │
│  • X-Vite-Transformed: true (dev mode)                    │
│  • Body: transformed code                                 │
└───────────────────────────────────────────────────────────┘
```

### HMR Flow Diagram

```
┌──────────────────┐
│  File Changed    │  (e.g., src/App.vue modified)
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│  Chokidar Watcher detects change                         │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│  PluginContainer.watchChange(id, { event: 'update' })    │
│  • Called per-environment if configured                  │
│  • Plugins can invalidate caches                         │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│  Module Graph Invalidation                               │
│  • Find module node                                      │
│  • Collect affected modules (importers)                  │
│  • Invalidate transformed code cache                     │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│  PluginContainer.hotUpdate(options)                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  options: {                                        │  │
│  │    file: '/abs/path/to/App.vue',                  │  │
│  │    timestamp: Date.now(),                         │  │
│  │    modules: [moduleNode],                         │  │
│  │  }                                                 │  │
│  │                                                    │  │
│  │  Plugin can:                                       │  │
│  │  1. Return filtered modules (e.g., only <script>) │  │
│  │  2. Return [] and send custom HMR via             │  │
│  │     this.environment.hot.send({ type: 'custom' }) │  │
│  │  3. Return void (default HMR behavior)            │  │
│  └────────────────────────────────────────────────────┘  │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│  HMR Payload Construction & Send                         │
│  • WebSocket message to client                           │
│  • Type: 'update' | 'full-reload' | 'custom'             │
│  • Payload includes module path, timestamp, etc.         │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│  Client-side HMR Runtime                                 │
│  • Fetch updated module                                  │
│  • Re-execute module                                     │
│  • Update module in cache                                │
│  • Trigger framework-specific HMR (if applicable)        │
└──────────────────────────────────────────────────────────┘
```

---

## 11. Improvement Recommendations

### Performance Improvements

#### 1. **Plugin Filter Pre-compilation**
**Current**: Filters are compiled lazily on first use
**Improvement**: Pre-compile all filters during plugin resolution
```typescript
// Instead of lazy compilation in getCachedFilterForPlugin
// Compile all filters upfront in PluginContainer constructor
for (const plugin of plugins) {
  if (plugin.resolveId?.filter) {
    this._precompiledFilters.set(plugin, {
      resolveId: createIdFilter(plugin.resolveId.filter.id)
    })
  }
}
```
**Benefit**: Eliminates filter compilation overhead from hot paths

#### 2. **Hook Execution Short-circuiting**
**Current**: All plugins are iterated even if early result found
**Improvement**: Add fast-path exit for hookFirst
```typescript
// In resolveId/load
if (result && !plugin.continueOnResult) {
  return result  // Exit loop immediately
}
```
**Benefit**: Reduces unnecessary plugin iterations

#### 3. **Sourcemap Chain Optimization**
**Current**: Sourcemaps are combined after all transforms
**Improvement**: Stream sourcemap combinations during transforms
```typescript
// Incrementally combine as transforms complete
if (result.map) {
  ctx._combinedMap = combineSourcemaps(ctx._combinedMap, result.map)
}
```
**Benefit**: Reduces memory usage and final combination time

#### 4. **Module Info Caching**
**Current**: ModuleInfo proxy created per access
**Improvement**: Create proxy once and cache
```typescript
// Already implemented, but could be enhanced with LRU cache
this._moduleInfoCache = new LRU({ max: 10000 })
```

### Stability Improvements

#### 1. **Plugin Error Isolation**
**Current**: Plugin errors can crash server/build
**Improvement**: Add error boundary per plugin
```typescript
try {
  result = await handler.call(ctx, ...args)
} catch (e) {
  if (config.experimental.continueOnPluginError) {
    logger.error(`Plugin ${plugin.name} failed, continuing...`, e)
    // Continue to next plugin instead of crashing
    continue
  }
  throw e
}
```
**Benefit**: More resilient development experience

#### 2. **Plugin Validation Schema**
**Current**: No runtime validation of plugin structure
**Improvement**: Add Zod/JSON schema validation
```typescript
const pluginSchema = z.object({
  name: z.string(),
  enforce: z.enum(['pre', 'post']).optional(),
  // ... full schema
})

function validatePlugin(plugin: unknown): Plugin {
  return pluginSchema.parse(plugin)
}
```
**Benefit**: Early error detection, better error messages

#### 3. **Circular Dependency Detection**
**Current**: Can cause infinite loops in resolve/load
**Improvement**: Add depth tracking and circuit breaker
```typescript
class ResolveIdContext {
  private _depth = 0
  async resolve(id, importer) {
    if (this._depth > 100) {
      throw new Error('Circular resolve detected')
    }
    this._depth++
    try {
      return await this._container.resolveId(id, importer)
    } finally {
      this._depth--
    }
  }
}
```

#### 4. **Plugin Health Monitoring**
**Improvement**: Add telemetry for plugin performance
```typescript
{
  configResolved(config) {
    if (config.debug?.pluginPerformance) {
      this._monitor = new PluginMonitor(this.name)
    }
  },
  async transform(code, id) {
    const start = performance.now()
    try {
      return await actualTransform(code, id)
    } finally {
      this._monitor?.record('transform', performance.now() - start)
    }
  }
}
```
**Benefit**: Identify slow plugins, optimize plugin ordering

### Cleaner Extension Points

#### 1. **Typed Virtual Module API**
**Current**: Virtual modules use string IDs
**Improvement**: Dedicated virtual module registry
```typescript
interface VirtualModulePlugin {
  virtualModules?: {
    [id: string]: () => string | Promise<string>
  }
}

// In container
for (const [id, loader] of Object.entries(plugin.virtualModules || {})) {
  this._virtualModules.set(id, loader)
}
```

#### 2. **Declarative Filters**
**Current**: Filters in ObjectHook.filter
**Improvement**: Top-level filter declaration
```typescript
{
  name: 'my-plugin',
  filters: {
    transform: { id: '**/*.vue', code: /<template>/ }
  },
  transform(code, id) {
    // Only called if filters match
  }
}
```
**Benefit**: Clearer plugin structure, better performance

#### 3. **Plugin Composition API**
**Current**: Plugins are flat objects
**Improvement**: Allow plugin composition
```typescript
export function composePlugins(...plugins: Plugin[]): Plugin {
  return {
    name: `composed:${plugins.map(p => p.name).join('+')}`,
    // Merge hooks intelligently
  }
}
```

#### 4. **Environment-Specific Hook Variants**
**Current**: Single hook checks `this.environment.name`
**Improvement**: Declare per-environment hooks
```typescript
{
  name: 'my-plugin',
  transform: {
    client(code, id) {
      // Only runs in client environment
    },
    ssr(code, id) {
      // Only runs in SSR environment
    }
  }
}
```

### Better Lifecycle APIs

#### 1. **Explicit Initialization/Disposal**
**Current**: No formal plugin lifecycle beyond hooks
**Improvement**: Add init/dispose lifecycle
```typescript
interface Plugin {
  init?(): void | Promise<void>
  dispose?(): void | Promise<void>
}

// In container
await plugin.init?.()
// ... use plugin
await plugin.dispose?.()
```

#### 2. **Lazy Plugin Loading**
**Current**: All plugins loaded upfront
**Improvement**: Support async plugin factories
```typescript
{
  plugins: [
    async () => {
      const { default: plugin } = await import('heavy-plugin')
      return plugin()
    }
  ]
}
```
**Benefit**: Faster startup, load plugins only when needed

#### 3. **Plugin Dependencies Declaration**
**Current**: Implicit dependencies via execution order
**Improvement**: Explicit dependency graph
```typescript
{
  name: 'my-plugin',
  dependencies: ['vite:resolve', 'vite:css'],
  async configResolved(config) {
    // Guaranteed to run after dependencies
  }
}
```

### Safer Plugin Execution

#### 1. **Permission System**
**Improvement**: Opt-in permission model
```typescript
{
  name: 'my-plugin',
  permissions: {
    fileSystem: { read: true, write: false },
    network: { domains: ['api.example.com'] },
    process: { spawn: false }
  }
}

// Runtime enforcement
if (!plugin.permissions.fileSystem.write) {
  throw new Error(`Plugin ${plugin.name} not allowed to write files`)
}
```

#### 2. **Sandboxed Plugin Execution**
**Improvement**: Run untrusted plugins in isolated context
```typescript
import { Worker } from 'worker_threads'

class SandboxedPlugin {
  private _worker: Worker

  async transform(code, id) {
    return await this._worker.postMessage({ type: 'transform', code, id })
  }
}
```
**Note**: Would break plugins that depend on shared state

#### 3. **Plugin Timeout Enforcement**
**Improvement**: Prevent hanging plugins
```typescript
async function executePluginHook(plugin, hook, ...args) {
  const timeout = config.pluginTimeout || 30000
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Plugin timeout')), timeout)
  )
  return Promise.race([
    hook.apply(plugin, args),
    timeoutPromise
  ])
}
```

#### 4. **Read-Only Context Mode**
**Improvement**: Prevent accidental state mutation
```typescript
{
  transform: {
    readonly: true,  // Context is frozen
    handler(code, id) {
      // this.environment is read-only
      // this.resolve() still works
    }
  }
}
```

### Documentation & Debugging

#### 1. **Plugin Development Mode**
**Improvement**: Enhanced debugging tools
```typescript
// vite.config.ts
export default {
  pluginDevelopment: {
    enabled: true,
    logHooks: true,
    traceResolution: true,
    profilePerformance: true
  }
}
```

#### 2. **Hook Execution Visualization**
**Improvement**: Dev tools panel showing plugin execution
```typescript
// Visualize:
// - Which plugins ran
// - In what order
// - How long each took
// - What they returned
```

#### 3. **Type Safety Improvements**
**Improvement**: Better TypeScript inference
```typescript
// Instead of
const plugin: Plugin = { ... }

// Provide helper
const plugin = definePlugin({
  name: 'typed',
  transform(code, id) {
    // Full type inference for context
    this.environment  // ✓ typed
  }
})
```

---

## Conclusion

Vite's plugin architecture is a sophisticated, production-grade system that successfully extends Rollup's plugin interface while adding powerful development-mode capabilities. Its strengths include:

1. **Rollup Compatibility**: Seamless interop with Rollup ecosystem
2. **Performance**: Advanced filtering and lazy execution
3. **Flexibility**: Multi-environment, conditional application
4. **Developer Experience**: Rich context API, error formatting

Areas for future enhancement include improved stability guarantees, cleaner lifecycle APIs, and optional sandboxing for untrusted plugins. The architecture demonstrates excellent design patterns for hook-based extensibility in build tools.
