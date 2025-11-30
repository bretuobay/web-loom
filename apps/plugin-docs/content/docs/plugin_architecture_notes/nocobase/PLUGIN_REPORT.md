# NocoBase Plugin Architecture Analysis

## 1. High-Level Summary

### Architecture Type

NocoBase implements a **hybrid plugin architecture** combining multiple architectural patterns:

- **Registry-based**: Central `PluginManager` maintains plugin instances in memory
- **Database-driven**: Plugin state (enabled/disabled, installed, version) persisted in `applicationPlugins` collection
- **Dynamic loading**: Runtime plugin installation and hot-swapping via npm/upload
- **Dependency injection**: Plugins receive `Application` instance with access to all core services
- **Event-driven**: Lifecycle hooks and application-wide events for plugin coordination
- **Isomorphic**: Separate but parallel client and server plugin systems

### Problem Solved

The plugin system enables:

- **Extreme modularity**: Core features (ACL, workflows, file management) are themselves plugins
- **Runtime extensibility**: Add/remove/update plugins without code changes or rebuild
- **Multi-tenancy support**: Different plugin configurations per application instance
- **Market ecosystem**: Third-party plugin distribution via npm or file upload
- **Zero-downtime updates**: Graceful reload/restart after plugin changes
- **Granular control**: Enable/disable individual features without uninstalling
- **Dependency management**: Automatic topological sorting ensures correct load order

---

## 2. Plugin Discovery & Loading

### Discovery Mechanisms

#### File System Scanning

**Location**: `packages/core/server/src/plugin-manager/findPackageNames.ts`

```typescript
// Multi-pattern glob search
const patterns = [
  './packages/plugins/*/package.json', // Built-in plugins
  './packages/plugins/*/*/package.json',
  './packages/pro-plugins/*/*/package.json', // Pro plugins
  './storage/plugins/*/package.json', // User-installed
  './storage/plugins/*/*/package.json',
];
```

#### Environment-Based Discovery

```bash
PLUGIN_PACKAGE_PREFIX="@nocobase/plugin-,@nocobase/preset-"  # Package prefixes
PLUGIN_STORAGE_PATH="/path/to/storage/plugins"                # Upload location
PLUGIN_PATH="/custom/plugin/paths"                            # Local dev paths
APPEND_PRESET_BUILT_IN_PLUGINS="extra-plugin-1,extra-plugin-2"
```

#### Database-Driven Discovery

**Collection**: `applicationPlugins` (packages/core/server/src/plugin-manager/options/collection.ts:13-27)

```typescript
{
  name: 'applicationPlugins',
  fields: [
    { type: 'string', name: 'name', unique: true },       // e.g., "acl"
    { type: 'string', name: 'packageName', unique: true },// e.g., "@nocobase/plugin-acl"
    { type: 'string', name: 'version' },                  // Installed version
    { type: 'boolean', name: 'enabled' },                 // Runtime state
    { type: 'boolean', name: 'installed' },               // Setup complete?
    { type: 'boolean', name: 'builtIn' },                 // Core vs user plugin
    { type: 'json', name: 'options' },                    // Custom configuration
  ]
}
```

#### Preset-Based Discovery

**File**: `packages/presets/nocobase/package.json`

```json
{
  "builtIn": [
    "@nocobase/plugin-acl",
    "@nocobase/plugin-users",
    "@nocobase/plugin-workflow"
    // 50+ core plugins...
  ]
}
```

### Loading Mechanism

#### Two-Phase Plugin Initialization

**Location**: packages/core/server/src/plugin-manager/plugin-manager.ts:379-382

```typescript
async initPlugins() {
  await this.initPresetPlugins();    // 1. Load from options/presets
  await this.initOtherPlugins();     // 2. Load from database
}
```

#### Dynamic Import with Cache Clearing

**Location**: packages/core/server/src/plugin-manager/plugin-manager.ts:204-211

```typescript
static async resolvePlugin(pluginName: string | typeof Plugin, isUpgrade = false) {
  if (typeof pluginName === 'string') {
    const { packageName } = await this.parseName(pluginName);
    return await importModule(packageName);  // Dynamic ESM/CommonJS import
  }
  return pluginName;
}
```

#### Name Resolution Strategy

**Location**: packages/core/server/src/plugin-manager/plugin-manager.ts:215-246

```typescript
// Resolves "acl" → "@nocobase/plugin-acl"
static async parseName(nameOrPkg: string) {
  // 1. Direct match: "@nocobase/plugin-acl" → returns as-is
  // 2. Check if exists: "acl" → "@nocobase/plugin-acl"
  // 3. Check presets: "nocobase" → "@nocobase/preset-nocobase"
  // 4. Fallback: return name as packageName
}
```

---

## 3. Plugin Registration

### Registration Process

**Location**: packages/core/server/src/plugin-manager/plugin-manager.ts:317-374

```typescript
async add(plugin?: string | typeof Plugin, options: any = {}) {
  // 1. Resolve plugin class
  const P = await PluginManager.resolvePlugin(options.packageName || plugin);

  // 2. Instantiate with app proxy
  const instance: Plugin = new P(createAppProxy(this.app), options);

  // 3. Register in memory
  this.pluginInstances.set(P, instance);           // By class reference
  this.pluginAliases.set(options.name, instance);  // By name

  // 4. Trigger lifecycle hook
  await instance.afterAdd();
}
```

### Dual Registry System

#### In-Memory Registry

```typescript
// packages/core/server/src/plugin-manager/plugin-manager.ts:73-78
pluginInstances = new Map<typeof Plugin, Plugin>(); // Class → Instance
pluginAliases = new Map<string, Plugin>(); // Name → Instance
```

#### Database Registry

```typescript
// Persisted state in applicationPlugins collection
await this.repository.updateOrCreate({
  values: {
    name: 'acl',
    packageName: '@nocobase/plugin-acl',
    enabled: true,
    installed: true,
    version: '1.9.11',
  },
  filterKeys: ['name'],
});
```

### Plugin Access Methods

**Location**: packages/core/server/src/plugin-manager/plugin-manager.ts:266-286

```typescript
// Get by name or class
get<T extends Plugin>(name: string | typeof Plugin): T {
  if (typeof name === 'string') {
    return this.pluginAliases.get(name);
  }
  return this.pluginInstances.get(name);
}

// Check existence
has(name: string | typeof Plugin): boolean {
  return typeof name === 'string'
    ? this.pluginAliases.has(name)
    : this.pluginInstances.has(name);
}
```

---

## 4. Plugin Interface / Contract

### Server-Side Plugin Contract

**Base Class**: `packages/core/server/src/plugin.ts:43-251`

```typescript
export abstract class Plugin<O = any> implements PluginInterface {
  options: any; // Plugin configuration
  app: Application; // Core application instance

  // Convenience getters
  get name(): string; // Plugin name
  get pm(); // PluginManager instance
  get db(); // Database instance
  get log(); // Scoped logger
  get enabled(): boolean; // Runtime state
  get installed(): boolean;
  get isPreset(): boolean;

  // Lifecycle hooks (all optional)
  afterAdd() {} // After registration
  beforeLoad() {} // Before load phase
  async load() {} // Main initialization
  async install(options?) {} // First-time setup
  async upgrade() {} // Version migration
  async beforeEnable() {}
  async afterEnable() {}
  async beforeDisable() {}
  async afterDisable() {}
  async beforeRemove() {}
  async afterRemove() {}

  // Utilities
  t(text, options); // i18n translation
  createLogger(options); // Create scoped logger
  sendSyncMessage(message, options); // Cluster messaging

  // Internal (auto-called by framework)
  async loadMigrations(); // Load DB migrations
  async loadCollections(); // Load DB schemas
}
```

### Client-Side Plugin Contract

**Base Class**: `packages/core/client/src/application/Plugin.ts:13-59`

```typescript
export class Plugin<T = any> {
  constructor(
    public options: T,
    protected app: Application,
  ) {}

  // Convenience getters
  get pluginManager(); // Client plugin manager
  get router(); // React Router instance
  get pluginSettingsManager(); // Settings panel registry
  get schemaInitializerManager(); // UI component initializers
  get schemaSettingsManager(); // Component settings panels
  get dataSourceManager(); // Data source registry

  // Lifecycle hooks
  async afterAdd() {}
  async beforeLoad() {}
  async load() {} // Register UI components

  // Utilities
  t(text, options); // i18n translation
}
```

### Required vs Optional Elements

**Required**:

- Plugin class extending `Plugin` base class
- `load()` method implementation (can be empty)
- Valid `package.json` with correct naming convention

**Optional**:

- All lifecycle hooks (default no-op implementations)
- Configuration options
- Database collections
- Migrations
- Custom resources/actions

---

## 5. Plugin Lifecycle

### Complete Lifecycle Sequence

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION START                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. DISCOVERY & REGISTRATION                                 │
│    • Scan filesystem + presets                              │
│    • Load from database                                     │
│    • Topological sort (dependencies)                        │
│    • new Plugin(app, options)                               │
│    • instance.afterAdd()                                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. BEFORE LOAD PHASE                                        │
│    FOR EACH enabled plugin:                                 │
│      • plugin.beforeLoad()                                  │
│      • Register middleware, resources, ACL snippets         │
│      • Add database migrations                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. LOAD PHASE                                               │
│    FOR EACH enabled plugin:                                 │
│      • app.emitAsync('beforeLoadPlugin', plugin)            │
│      • plugin.loadCollections()  (auto-load from /collections)│
│      • plugin.load()             (custom initialization)    │
│      • plugin.state.loaded = true                           │
│      • app.emitAsync('afterLoadPlugin', plugin)             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. INSTALLATION PHASE (first-time or not installed)         │
│    • db.sync()  (create tables)                             │
│    FOR EACH enabled && !installed plugin:                   │
│      • app.emitAsync('beforeInstallPlugin', plugin)         │
│      • plugin.install()                                     │
│      • Update DB: installed = true                          │
│      • app.emitAsync('afterInstallPlugin', plugin)          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. UPGRADE PHASE (version changes)                          │
│    FOR EACH enabled plugin with newer version:              │
│      • plugin.upgrade()                                     │
│      • Run migrations                                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    RUNTIME OPERATIONS                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ENABLE PLUGIN (runtime operation)                           │
│    • plugin.beforeEnable()                                  │
│    • db.sync()                                              │
│    • plugin.install() (if not installed)                    │
│    • Update DB: enabled = true, installed = true            │
│    • plugin.afterEnable()                                   │
│    • app.tryReloadOrRestart()                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DISABLE PLUGIN (runtime operation)                          │
│    • plugin.beforeDisable()                                 │
│    • plugin.enabled = false                                 │
│    • plugin.afterDisable()                                  │
│    • Update DB: enabled = false                             │
│    • app.tryReloadOrRestart()                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ REMOVE PLUGIN (destructive operation)                       │
│    • plugin.beforeRemove()                                  │
│    • Delete from DB                                         │
│    • plugin.afterRemove()                                   │
│    • rm -rf node_modules/@nocobase/plugin-xxx               │
│    • app.tryReloadOrRestart()                               │
└─────────────────────────────────────────────────────────────┘
```

### Lifecycle Implementation

**Location**: packages/core/server/src/plugin-manager/plugin-manager.ts:426-508

```typescript
async load(options: any = {}) {
  // Phase 1: beforeLoad for all plugins
  for (const [P, plugin] of this.getPlugins()) {
    if (!plugin.enabled) continue;
    await plugin.beforeLoad();
  }

  // Phase 2: loadCollections + load for all plugins
  for (const [P, plugin] of this.getPlugins()) {
    if (!plugin.enabled) continue;
    await this.app.emitAsync('beforeLoadPlugin', plugin, options);
    await plugin.loadCollections();  // Auto-load from filesystem
    await plugin.load();              // Custom logic
    plugin.state.loaded = true;
    await this.app.emitAsync('afterLoadPlugin', plugin, options);
  }
}
```

---

## 6. Extension Points

### A. Database Collections

**Pattern**: Define database schemas in `server/collections/*.ts`

```typescript
// packages/plugins/@nocobase/plugin-acl/src/server/collections/roles.ts
export default defineCollection({
  name: 'roles',
  fields: [
    { type: 'string', name: 'name', unique: true },
    { type: 'string', name: 'title' },
    { type: 'boolean', name: 'default' },
    { type: 'json', name: 'strategy' },
    { type: 'belongsToMany', name: 'users' },
  ],
});
```

**Auto-loading**: `plugin.loadCollections()` imports all files from `server/collections/`

### B. Resources & Actions (RESTful API)

**Pattern**: Define API endpoints in `beforeLoad()`

```typescript
// packages/plugins/@nocobase/plugin-acl/src/server/server.ts:165-172
async beforeLoad() {
  // Define new resource
  this.app.resourcer.define({
    name: 'availableActions',
    actions: {
      async list(ctx, next) {
        ctx.body = await getAvailableActions();
        await next();
      }
    }
  });

  // Register action handler
  this.app.resourcer.registerActionHandler('roles:check', checkAction);
  this.app.resourcer.registerActionHandler('users:setDefaultRole', setDefaultRole);
}
```

**API Access**: `GET /api/availableActions:list`, `POST /api/roles:check`

### C. Middleware (Request Pipeline)

**Pattern**: Register middleware with positioning tags

```typescript
// packages/plugins/@nocobase/plugin-acl/src/server/server.ts
async beforeLoad() {
  // Resource-level middleware
  this.app.resourcer.use(aclMiddleware, {
    tag: 'acl',
    after: 'auth',      // Position in pipeline
    before: 'core'
  });

  // Global middleware
  this.app.use(globalMiddleware, {
    tag: 'my-middleware',
    after: 'dataSource'
  });
}
```

**Middleware Tags**: Control execution order (`auth` → `acl` → `core` → ...)

### D. Access Control (ACL)

**Pattern**: Register permissions and snippets

```typescript
// packages/core/server/src/plugin-manager/plugin-manager.ts:100-103
this.app.acl.registerSnippet({
  name: 'pm.acl.roles',
  actions: [
    'roles:*', // All role actions
    'roles.users:*', // Associated users
    'availableActions:list', // Specific action
  ],
});

// Allow public access
this.app.acl.allow('pm', 'listEnabled', 'public');

// Role-based access
this.app.acl.allow('users', 'setDefaultRole', 'loggedIn');

// Fixed query parameters
this.app.acl.addFixedParams('collections', 'destroy', () => ({
  filter: { 'name.$ne': 'system' }, // Prevent system collection deletion
}));
```

### E. Database Events & Hooks

**Pattern**: Subscribe to database lifecycle events

```typescript
// packages/plugins/@nocobase/plugin-acl/src/server/server.ts:174-187
this.db.on('users.afterCreateWithAssociations', async (model, options) => {
  const { transaction } = options;
  const defaultRole = await this.db.getRepository('roles').findOne({
    filter: { default: true },
    transaction,
  });

  if (defaultRole) {
    await model.addRoles(defaultRole, { transaction });
  }
});
```

**Event Naming**: `{collection}.{before|after}{Action}`

- `users.beforeCreate`
- `roles.afterUpdate`
- `posts.afterSaveWithAssociations`

### F. Database Migrations

**Pattern**: Version-controlled schema changes

```typescript
// packages/plugins/@nocobase/plugin-acl/src/server/server.ts:101-107
async beforeLoad() {
  this.db.addMigrations({
    namespace: this.name,
    directory: resolve(__dirname, './migrations'),
    context: { plugin: this }
  });
}

// Migration file: server/migrations/20221214072638-set-role-snippets.ts
export default {
  async up() {
    const repo = this.context.plugin.db.getRepository('roles');
    await repo.update({
      filter: { name: 'admin' },
      values: { snippets: ['pm', 'ui.*'] }
    });
  }
}
```

### G. Application Events

**Pattern**: Subscribe to application-level events

```typescript
// packages/plugins/@nocobase/plugin-acl/src/server/server.ts:189-206
this.app.on('acl:writeRoleToACL', async (roleModel: RoleModel) => {
  await this.writeRoleToACL(roleModel);
});

this.app.db.on('roles.afterSaveWithAssociations', async (model, options) => {
  await this.app.emitAsync('acl:writeRoleToACL', model);
});
```

### H. Client-Side Extensions

#### Plugin Settings Panel

```typescript
// packages/plugins/@nocobase/plugin-acl/src/client/index.ts:22-28
async load() {
  this.pluginSettingsManager.add('users-permissions.roles', {
    title: this.t('Roles & Permissions'),
    icon: 'LockOutlined',
    Component: RolesManagement,
    aclSnippet: 'pm.acl.roles',  // Required permission
    sort: 3,
  });
}
```

#### Schema Initializers (UI Builder)

```typescript
this.schemaInitializerManager.add(myInitializer);
```

#### Schema Settings (Component Config)

```typescript
this.schemaSettingsManager.add(mySettings);
```

#### Routes (Client-Side Routing)

```typescript
this.router.add('admin.settings', {
  path: '/admin/settings',
  Component: SettingsPage,
});
```

#### Data Sources

```typescript
this.dataSourceManager.addDataSource(MyDataSource, options);
```

---

## 7. Configuration & Metadata

### Plugin Package.json Format

**Location**: `packages/plugins/@nocobase/plugin-acl/package.json`

```json
{
  "name": "@nocobase/plugin-acl",
  "version": "1.9.11",
  "main": "./dist/server/index.js",

  // Multilingual metadata
  "displayName": "Access control",
  "displayName.zh-CN": "权限控制",
  "displayName.ru-RU": "Контроль доступа",

  "description": "Based on roles, resources, and actions...",
  "description.zh-CN": "基于角色、资源和操作的权限控制...",

  "homepage": "https://docs.nocobase.com/handbook/acl",
  "homepage.zh-CN": "https://docs-cn.nocobase.com/handbook/acl",

  // Categorization
  "keywords": ["Users & permissions"],

  // Dependencies (used for plugin dependency resolution)
  "peerDependencies": {
    "@nocobase/server": "1.x",
    "@nocobase/client": "1.x",
    "@nocobase/database": "1.x",
    "@nocobase/plugin-users": "1.x" // Plugin dependency
  }
}
```

### Plugin Directory Structure

```
@nocobase/plugin-acl/
├── package.json                    # Metadata & dependencies
├── src/
│   ├── index.ts                    # Main entry (exports server)
│   ├── server/
│   │   ├── index.ts                # Server plugin export
│   │   ├── server.ts               # PluginACLServer class
│   │   ├── collections/            # Database schemas (auto-loaded)
│   │   │   ├── roles.ts
│   │   │   └── rolesResources.ts
│   │   ├── migrations/             # Version migrations (auto-loaded)
│   │   │   └── 20221214072638-set-role-snippets.ts
│   │   ├── actions/                # API action handlers
│   │   ├── middlewares/            # Request middleware
│   │   └── models/                 # Database model classes
│   └── client/
│       ├── index.ts                # Client plugin export
│       ├── schemas/                # UI schemas
│       └── locale.ts               # i18n translations
└── dist/                           # Compiled output
```

### Runtime Configuration

#### Environment Variables

```bash
PLUGIN_PACKAGE_PREFIX="@nocobase/plugin-,@nocobase/preset-"
PLUGIN_STORAGE_PATH="./storage/plugins"
NODE_MODULES_PATH="./node_modules"
```

#### Database Configuration

```typescript
// applicationPlugins collection stores runtime state
{
  name: 'acl',
  packageName: '@nocobase/plugin-acl',
  version: '1.9.11',
  enabled: true,      // Toggle on/off
  installed: true,    // Setup complete
  builtIn: true,      // Core vs user plugin
  options: {          // Custom per-instance config
    customSetting: 'value'
  }
}
```

#### Programmatic Configuration

```typescript
// Adding preset plugins with options
app.pm.addPreset('@nocobase/plugin-acl', {
  enabled: true,
  customOption: 'value',
});
```

### Hot Reload Support

**Location**: packages/core/server/src/plugin-manager/plugin-manager.ts:677-683

```typescript
async enable(pluginNames) {
  // ... enable logic ...
  await this.app.tryReloadOrRestart();  // Graceful reload or process restart
}
```

**Reload Strategy**:

1. Try in-process reload (re-import modules)
2. Fallback to process restart via PM2
3. Maintain database connections across reloads

---

## 8. Security, Isolation & Error Handling

### Security Measures

#### 1. Package Name Validation

**Location**: packages/core/server/src/plugin-manager/plugin-manager.ts:963-974

```typescript
getNameByPackageName(packageName: string) {
  const prefixes = PluginManager.getPluginPkgPrefix();
  const prefix = prefixes.find((prefix) => packageName.startsWith(prefix));

  if (!prefix) {
    throw new Error(
      `package name [${packageName}] invalid, ` +
      `just support ${prefixes.join(', ')}`
    );
  }
  return packageName.replace(prefix, '');
}
```

**Protection**: Prevents arbitrary package installation (only `@nocobase/*` by default)

#### 2. Upload Validation

**Middleware**: `packages/core/server/src/plugin-manager/middleware.ts`

- File type validation (ZIP/TGZ only)
- Package.json schema validation
- Version compatibility checks

#### 3. ACL Integration

```typescript
// Plugin management requires permissions
this.app.acl.registerSnippet({
  name: 'pm',
  actions: ['pm:*'], // Install, enable, disable, remove
});
```

**Default**: Only administrators can manage plugins

#### 4. Compatibility Checks

**Location**: packages/core/server/src/plugin-manager/utils.ts

```typescript
export async function checkAndGetCompatible(packageName: string) {
  const packageJson = await PluginManager.getPackageJson(packageName);
  const peerDeps = packageJson.peerDependencies;

  // Check if core versions match
  if (peerDeps['@nocobase/server']) {
    const requiredVersion = peerDeps['@nocobase/server'];
    const currentVersion = require('@nocobase/server/package.json').version;

    if (!semver.satisfies(currentVersion, requiredVersion)) {
      return { compatible: false, reason: 'version mismatch' };
    }
  }

  return { compatible: true };
}
```

### Isolation Mechanisms

#### 1. No True Sandboxing

- Plugins run in the same Node.js process
- Full access to `app`, `db`, `acl` instances
- Can require any installed npm package

**Rationale**: Performance over isolation (trusted plugin ecosystem)

#### 2. Namespace Isolation

```typescript
// Collections namespaced by plugin
this.db.collection({
  name: 'myPluginData',
  from: this.options.packageName, // Tracks ownership
});

// Migrations namespaced
this.db.addMigrations({
  namespace: this.name, // 'acl', 'workflow', etc.
  directory: './migrations',
});
```

#### 3. Scoped Logging

```typescript
// Each plugin gets its own logger
get log() {
  return this.app.log.child({ module: this.name });
}
```

### Error Handling

#### 1. Graceful Plugin Load Failures

**Location**: packages/core/server/src/plugin-manager/plugin-manager.ts:351-356

```typescript
async add(plugin, options) {
  try {
    P = await PluginManager.resolvePlugin(plugin);
  } catch (error) {
    this.app.log.warn('plugin not found', error);
    return;  // Skip plugin, continue loading others
  }
}
```

#### 2. Transaction-Safe Installation

```typescript
async install(options) {
  for (const plugin of this.getPlugins()) {
    try {
      await plugin.install(options);
    } catch (error) {
      // Rollback on failure
      await this.app.tryReloadOrRestart({ recover: true });
      throw error;
    }
  }
}
```

#### 3. Enable/Disable Recovery

**Location**: packages/core/server/src/plugin-manager/plugin-manager.ts:608-683

```typescript
async enable(pluginNames) {
  try {
    // ... enable logic ...
    await this.app.tryReloadOrRestart();
  } catch (error) {
    // Rollback to previous state
    await this.app.tryReloadOrRestart({ recover: true });
    throw error;
  }
}
```

#### 4. Cluster Synchronization

```typescript
// Sync plugin state across cluster workers
async sendSyncMessage(message: any, options?: Transactionable) {
  await this.app.syncMessageManager.publish(this.name, message, options);
}

// Handle sync messages
async handleSyncMessage(message) {
  if (message.type === 'syncRole') {
    await this.writeRoleToACL(message.roleName);
  }
}
```

---

## 9. Dependency Management

### Dependency Declaration

**Method**: `peerDependencies` in `package.json`

```json
{
  "peerDependencies": {
    "@nocobase/server": "1.x", // Core framework
    "@nocobase/database": "1.x", // Core package
    "@nocobase/plugin-users": "1.x" // Plugin dependency
  }
}
```

### Topological Sorting

**Location**: packages/core/server/src/plugin-manager/plugin-manager.ts:1151-1163

```typescript
private async sort(names: string | string[]) {
  const pluginNames = _.castArray(names);
  const sorter = new Topo.Sorter<string>();  // @hapi/topo library

  for (const pluginName of pluginNames) {
    const packageJson = await PluginManager.getPackageJson(pluginName);
    const peerDependencies = Object.keys(packageJson?.peerDependencies || {});

    sorter.add(pluginName, {
      after: peerDependencies,          // Load AFTER dependencies
      group: packageJson?.packageName
    });
  }

  return sorter.nodes;  // Returns: [users, auth, acl, workflow, ...]
}
```

**Example Dependency Chain**:

```
@nocobase/plugin-users (no dependencies)
  ↓
@nocobase/plugin-auth (depends on users)
  ↓
@nocobase/plugin-acl (depends on users, auth)
  ↓
@nocobase/plugin-workflow (depends on acl)
```

### Dependency Resolution Algorithm

#### 1. Enable Plugin with Dependencies

**Location**: packages/core/server/src/plugin-manager/plugin-manager.ts:553-684

```typescript
async enable(nameOrPkg: string | string[]) {
  // 1. Topologically sort plugin names
  const pluginNames = await this.sort(nameOrPkg);

  // 2. Add all plugins to registry (if not already added)
  for (const name of pluginNames) {
    if (!this.has(name)) {
      await this.add(name);
    }
  }

  // 3. beforeLoad in sorted order
  for (const name of pluginNames) {
    const plugin = this.get(name);
    await plugin.beforeLoad();
  }

  // 4. load in sorted order
  for (const name of pluginNames) {
    const plugin = this.get(name);
    await plugin.loadCollections();
    await plugin.load();
  }

  // 5. Enable in sorted order
  for (const name of pluginNames) {
    const plugin = this.get(name);
    await plugin.beforeEnable();
    // ... sync db, install if needed ...
    await plugin.afterEnable();
  }
}
```

### Dependency Installation Workflow

#### Upload/Install Flow

**Location**: packages/core/server/src/plugin-manager/utils.ts

```typescript
// 1. Download plugin (npm or URL)
await downloadAndUnzipToTempDir(compressedFileUrl, authToken);

// 2. Extract to storage/plugins/
await copyTempPackageToStorageAndLinkToNodeModules(tempFile, tempDir, packageName);

// 3. Create symlink in node_modules/
await fs.symlink(
  resolve(PLUGIN_STORAGE_PATH, packageName),
  resolve(NODE_MODULES_PATH, packageName),
  'junction', // Windows-compatible
);

// 4. Parse dependencies from package.json
const packageJson = await fs.readJSON(packageJsonPath);
const dependencies = Object.keys(packageJson.peerDependencies || {});

// 5. Check if dependencies are installed
for (const dep of dependencies) {
  if (dep.startsWith('@nocobase/plugin-')) {
    const depInstalled = await this.repository.findOne({
      filter: { packageName: dep },
    });
    if (!depInstalled) {
      throw new Error(`Missing dependency: ${dep}`);
    }
  }
}

// 6. Enable in dependency order
await this.enable([...dependencies, packageName]);
```

### No Dependency Injection Container

**Pattern**: Direct property access via getters

```typescript
// No DI container - plugins access services via app instance
class MyPlugin extends Plugin {
  async load() {
    this.db.collection(...)           // Direct access
    this.app.acl.allow(...)            // Direct access
    this.app.resourcer.define(...)     // Direct access
  }
}
```

**Trade-off**: Simpler but tighter coupling to core API

### Version Constraints

#### Semver Compatibility

```json
{
  "peerDependencies": {
    "@nocobase/server": "1.x", // Any 1.x.x version
    "@nocobase/plugin-users": "^1.9.0" // >= 1.9.0 < 2.0.0
  }
}
```

#### Runtime Compatibility Check

```typescript
async toJSON(options) {
  return {
    ...this.options,
    ...(await checkAndGetCompatible(this.packageName)),
    // Returns: { compatible: boolean, reason?: string }
  };
}
```

---

## 10. Architecture Diagrams

### System Architecture

```mermaid
graph TB
    subgraph "Application Layer"
        App[Application Instance]
        PM[PluginManager]
    end

    subgraph "Storage Layer"
        FS[File System]
        DB[(Database)]
        NPM[npm Registry]
    end

    subgraph "Plugin Registry"
        Memory[In-Memory Registry<br/>pluginInstances<br/>pluginAliases]
        DBReg[(applicationPlugins<br/>Collection)]
    end

    subgraph "Plugin Instances"
        P1[Plugin: ACL]
        P2[Plugin: Users]
        P3[Plugin: Workflow]
        PN[Plugin: ...]
    end

    subgraph "Core Services"
        Resourcer[Resourcer<br/>API Resources]
        ACL[ACL<br/>Access Control]
        DBService[Database<br/>Collections]
        Router[Router<br/>Routes]
    end

    App --> PM
    PM --> Memory
    PM --> DBReg

    PM --> P1
    PM --> P2
    PM --> P3
    PM --> PN

    P1 --> Resourcer
    P1 --> ACL
    P1 --> DBService
    P2 --> Resourcer
    P2 --> ACL

    PM -.discovery.-> FS
    PM -.discovery.-> DB
    PM -.download.-> NPM

    DBReg -.persist.-> DB
    Memory -.sync.-> DBReg

    style App fill:#e1f5ff
    style PM fill:#fff4e1
    style Memory fill:#f0f0f0
    style DBReg fill:#f0f0f0
```

### Plugin Lifecycle Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant PM as PluginManager
    participant DB as Database
    participant P as Plugin Instance

    App->>PM: load()

    Note over PM: Discovery Phase
    PM->>DB: Load from applicationPlugins
    PM->>PM: Scan filesystem
    PM->>PM: Topological sort

    Note over PM: Registration Phase
    loop For each plugin
        PM->>PM: resolvePlugin()
        PM->>P: new Plugin(app, options)
        PM->>P: afterAdd()
        PM->>PM: Register in memory
    end

    Note over PM: Load Phase
    loop For each enabled plugin
        PM->>P: beforeLoad()
        Note over P: Register middleware<br/>ACL, resources, etc.
    end

    loop For each enabled plugin
        App->>App: emit('beforeLoadPlugin')
        PM->>P: loadCollections()
        PM->>P: load()
        App->>App: emit('afterLoadPlugin')
    end

    Note over PM: Installation Phase
    App->>DB: db.sync()

    loop For each !installed plugin
        App->>App: emit('beforeInstallPlugin')
        PM->>P: install()
        PM->>DB: UPDATE installed=true
        App->>App: emit('afterInstallPlugin')
    end

    Note over App: Runtime - Plugin Ready
```

### Plugin Discovery & Loading Pipeline

```mermaid
graph LR
    subgraph "Discovery Sources"
        Preset[Preset Plugins<br/>app.pm.addPreset]
        BuiltIn[Built-in<br/>packages/plugins]
        Storage[User Plugins<br/>storage/plugins]
        DBState[(Database<br/>applicationPlugins)]
    end

    subgraph "Discovery Pipeline"
        Scan[File System Scan<br/>glob patterns]
        Parse[Name Resolution<br/>parseName]
        Topo[Topological Sort<br/>by dependencies]
    end

    subgraph "Loading Pipeline"
        Resolve[Resolve Plugin<br/>dynamic import]
        Instantiate[new Plugin<br/>createAppProxy]
        Register[Register in Memory<br/>pluginInstances]
    end

    subgraph "Registry"
        Memory[In-Memory Map]
        DB[(DB Persistence)]
    end

    Preset --> Parse
    BuiltIn --> Scan
    Storage --> Scan
    DBState --> Parse

    Scan --> Parse
    Parse --> Topo
    Topo --> Resolve

    Resolve --> Instantiate
    Instantiate --> Register

    Register --> Memory
    Register --> DB

    style Preset fill:#e3f2fd
    style BuiltIn fill:#e8f5e9
    style Storage fill:#fff3e0
    style DBState fill:#f3e5f5
```

### Extension Points Architecture

```mermaid
graph TB
    subgraph "Plugin"
        P[Plugin Instance]
    end

    subgraph "Extension Points"
        Collections[Database Collections<br/>defineCollection]
        Resources[API Resources<br/>resourcer.define]
        Actions[Action Handlers<br/>registerActionHandler]
        Middleware[Middleware<br/>resourcer.use]
        ACLExt[ACL Extensions<br/>acl.registerSnippet]
        Events[Event Listeners<br/>db.on, app.on]
        Migrations[Migrations<br/>db.addMigrations]

        subgraph "Client Extensions"
            Settings[Plugin Settings<br/>pluginSettingsManager]
            Schema[Schema Initializers<br/>schemaInitializerManager]
            Routes[Routes<br/>router.add]
            DataSources[Data Sources<br/>dataSourceManager]
        end
    end

    subgraph "Core Services"
        DB[(Database)]
        Resourcer[Resourcer]
        ACL[ACL System]
        EventEmitter[Event Bus]
    end

    P --> Collections
    P --> Resources
    P --> Actions
    P --> Middleware
    P --> ACLExt
    P --> Events
    P --> Migrations
    P --> Settings
    P --> Schema
    P --> Routes
    P --> DataSources

    Collections --> DB
    Resources --> Resourcer
    Actions --> Resourcer
    Middleware --> Resourcer
    ACLExt --> ACL
    Events --> EventEmitter
    Migrations --> DB

    style P fill:#e1f5ff
    style DB fill:#f0f0f0
    style Resourcer fill:#f0f0f0
    style ACL fill:#f0f0f0
    style EventEmitter fill:#f0f0f0
```

### Plugin State Transitions

```mermaid
stateDiagram-v2
    [*] --> Discovered: File scan / DB load

    Discovered --> Registered: add()
    Registered --> Registered: afterAdd()

    Registered --> Loading: load()
    Loading --> Loading: beforeLoad()
    Loading --> Loaded: Collections + load()

    Loaded --> Installing: install()
    Installing --> Installed: Setup complete

    Installed --> Enabled: enable()
    Enabled --> Installed: disable()

    Installed --> Upgrading: New version
    Upgrading --> Installed: upgrade()

    Enabled --> Removing: remove()
    Installed --> Removing: remove()
    Registered --> Removing: remove()
    Removing --> [*]: Cleanup + DB delete

    note right of Discovered
        Sources:
        - Filesystem
        - Database
        - Presets
    end note

    note right of Loaded
        State flags:
        - state.loaded = true
    end note

    note right of Enabled
        DB fields:
        - enabled = true
        - installed = true
    end note
```

---

## 11. Improvement Recommendations

### Performance Optimizations

#### 1. Lazy Loading for Client Plugins

**Current**: All enabled plugins loaded on app start
**Recommendation**:

```typescript
// Dynamic import on-demand
const plugin = await import(`@nocobase/plugin-${name}/client`);
await this.pluginManager.add(plugin);
```

**Benefit**: Faster initial page load, reduced bundle size

#### 2. Parallel Plugin Loading

**Current**: Sequential `await plugin.load()`
**Recommendation**:

```typescript
// Load independent plugins concurrently
await Promise.all(plugins.filter((p) => !hasDependencies(p)).map((p) => p.load()));
```

**Benefit**: 2-3x faster boot time for large plugin sets

#### 3. Plugin Metadata Caching

**Current**: Read `package.json` repeatedly
**Recommendation**:

```typescript
// Cache parsed metadata in Redis
const metadata = await redis.get(`plugin:${name}:metadata`);
if (!metadata) {
  metadata = await parsePackageJson(name);
  await redis.set(`plugin:${name}:metadata`, metadata, 'EX', 3600);
}
```

**Benefit**: Reduced filesystem I/O

### Stability Improvements

#### 1. Plugin Dependency Versioning

**Current**: Loose `peerDependencies` without enforcement
**Recommendation**:

```typescript
// Strict semver validation
if (!semver.satisfies(installedVersion, requiredVersion)) {
  throw new PluginCompatibilityError(
    `Plugin ${name} requires ${dep}@${requiredVersion}, ` + `but ${installedVersion} is installed`,
  );
}
```

#### 2. Rollback on Failed Enable

**Current**: Partial rollback on errors
**Recommendation**:

```typescript
// Full transaction with snapshot
const snapshot = await this.createSnapshot();
try {
  await this.enable(plugins);
} catch (error) {
  await this.restoreSnapshot(snapshot);
  throw error;
}
```

#### 3. Plugin Health Checks

**Recommendation**: Add health check API

```typescript
class Plugin {
  async healthCheck(): Promise<HealthStatus> {
    // Check database connections, external APIs, etc.
    return { healthy: true, details: {...} };
  }
}

// Periodic health monitoring
setInterval(async () => {
  for (const plugin of pm.getPlugins()) {
    const health = await plugin.healthCheck();
    if (!health.healthy) {
      await this.disablePlugin(plugin.name);
      await this.notifyAdmin(plugin.name, health);
    }
  }
}, 60000);
```

### Cleaner Extension Points

#### 1. Typed Extension API

**Current**: Untyped `app.resourcer.define()` calls
**Recommendation**:

```typescript
// Strongly typed builder pattern
class Plugin {
  async load() {
    this.defineResource({
      name: 'users',
      actions: {
        async list(ctx: Context): Promise<User[]> {
          return await this.db.getRepository('users').find();
        },
      },
    });
  }
}
```

#### 2. Declarative Plugin Manifests

**Current**: Imperative registration in `load()`
**Recommendation**:

```yaml
# plugin.yaml
name: @nocobase/plugin-acl
resources:
  - name: roles
    actions: [list, create, update, destroy]
  - name: permissions
    actions: [check, grant, revoke]

middleware:
  - name: aclMiddleware
    position: { after: auth }

collections:
  - ./collections/roles.ts
  - ./collections/permissions.ts
```

#### 3. Plugin Composition API

**Recommendation**: Enable plugin composition

```typescript
// Compose multiple plugins into one
class MyCompositePlugin extends Plugin {
  async load() {
    await this.usePlugin(WorkflowPlugin);
    await this.usePlugin(NotificationPlugin);

    // Add custom glue logic
    this.app.on('workflow:completed', async (workflow) => {
      await this.notificationPlugin.send({
        title: 'Workflow completed',
        workflow: workflow.id,
      });
    });
  }
}
```

### Better Lifecycle APIs

#### 1. Granular Lifecycle Hooks

**Current**: `beforeLoad`, `load`, `afterAdd`
**Recommendation**: Add more hooks

```typescript
class Plugin {
  async onDatabaseConnected() {} // After DB ready
  async onAllPluginsLoaded() {} // After all plugins loaded
  async onApplicationReady() {} // Before first request
  async onBeforeShutdown() {} // Graceful shutdown
  async onAfterReload() {} // After hot reload
}
```

#### 2. Async Initialization Support

**Current**: `load()` runs before app ready
**Recommendation**:

```typescript
// Wait for async initialization
class Plugin {
  async load() {
    this.resourcer.define(...);  // Sync registration
  }

  async initialize() {
    // Run after app.listen()
    await this.connectToExternalAPI();
    await this.warmupCache();
  }
}
```

### Safer Plugin Execution

#### 1. Plugin Sandboxing (Optional)

**Recommendation**: VM2-based isolation for untrusted plugins

```typescript
// Opt-in sandbox mode
class SandboxedPlugin extends Plugin {
  sandbox = true; // Run in isolated context

  permissions = {
    network: ['https://api.example.com'], // Whitelist
    filesystem: ['./uploads'],
    database: ['users', 'posts'],
  };
}
```

#### 2. Plugin Audit Logging

**Recommendation**: Track all plugin operations

```typescript
// Audit trail for security
await this.app.audit.log({
  action: 'plugin.enable',
  plugin: 'workflow',
  user: ctx.state.currentUser,
  timestamp: new Date(),
  metadata: { version: '1.2.3' },
});
```

#### 3. Plugin Timeout Protection

**Recommendation**: Prevent hung plugins

```typescript
// Timeout on lifecycle hooks
await Promise.race([plugin.load(), timeout(30000, `Plugin ${plugin.name}.load() timed out`)]);
```

### Developer Experience

#### 1. Plugin Development CLI

**Recommendation**: Enhanced scaffolding

```bash
# Generate plugin from template
nocobase create plugin my-plugin --template=workflow-node

# Hot reload during development
nocobase dev --watch-plugins

# Validate plugin before publish
nocobase validate plugin ./my-plugin
```

#### 2. Plugin Testing Framework

**Recommendation**: Built-in test utilities

```typescript
import { createTestApp, createTestPlugin } from '@nocobase/test';

describe('MyPlugin', () => {
  let app, plugin;

  beforeEach(async () => {
    app = await createTestApp();
    plugin = await createTestPlugin(MyPlugin, { enabled: true });
    await app.pm.add(plugin);
    await app.load();
  });

  it('should register resource', () => {
    expect(app.resourcer.get('myResource')).toBeDefined();
  });
});
```

#### 3. Plugin Documentation Generator

**Recommendation**: Auto-generate docs from code

```typescript
// Extract from JSDoc comments
/**
 * @plugin MyPlugin
 * @description Adds custom reporting features
 * @extensionPoints
 *   - resources: myReports
 *   - actions: myReports:generate
 * @dependencies @nocobase/plugin-users
 */
export class MyPlugin extends Plugin {
  // ... auto-documented in plugin marketplace
}
```

---

## Conclusion

NocoBase's plugin architecture is a **sophisticated, production-grade system** that enables:

- **Extreme modularity** (80+ built-in plugins)
- **Runtime extensibility** (hot-swapping without rebuild)
- **Database-driven state** (persistent enable/disable)
- **Dependency management** (topological sorting)
- **Dual client/server** plugins (isomorphic architecture)

**Strengths**:

- Clean separation of concerns (base class + lifecycle hooks)
- Rich extension points (12+ ways to extend)
- Hot reload support
- Multi-language metadata
- Event-driven coordination

**Areas for Improvement**:

- Add sandboxing for untrusted plugins
- Implement lazy loading for performance
- Enhance type safety with TypeScript
- Add declarative plugin manifests
- Improve error recovery and rollback

The architecture is well-suited for a **low-code platform** where features need to be composed, enabled, and disabled dynamically by non-technical users.
