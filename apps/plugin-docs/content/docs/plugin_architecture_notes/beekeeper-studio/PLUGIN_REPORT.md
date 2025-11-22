# Beekeeper Studio Plugin Architecture Report

## 1. High-Level Summary

### Architecture Type
**Hybrid Architecture**: Registry-based + Event-driven + Message-passing (postMessage) + IFrame-based Sandboxing

The Beekeeper Studio plugin system is a sophisticated hybrid architecture that combines:
- **Registry-based discovery**: Remote GitHub-hosted plugin registry for discoverability
- **Event-driven communication**: postMessage-based request/response and notification patterns
- **IFrame-based isolation**: Sandboxed execution environment for security
- **Factory pattern**: Menu item creation using factory pattern
- **Service-oriented**: Clean separation between file management, registry, and runtime loading

### Problem It Solves
The plugin system solves several key problems:

1. **Extensibility**: Allows third-party developers to extend Beekeeper Studio's functionality without modifying core code
2. **Security**: Sandboxes plugin code execution in iframes to prevent malicious code from accessing the host application
3. **UI Integration**: Provides multiple extension points (tabs, context menus, menubar) for plugins to integrate seamlessly into the UI
4. **Database Operations**: Exposes controlled database access to plugins through a structured API
5. **Distribution**: Centralized plugin registry on GitHub makes plugins discoverable and installable
6. **Versioning**: Supports plugin versioning, updates, and compatibility checks

---

## 2. Plugin Discovery & Loading

### Discovery Mechanisms

**Remote Registry Discovery**
- **Registry Location**: GitHub-hosted JSON file
  - URL: `https://raw.githubusercontent.com/beekeeper-studio/beekeeper-studio-plugins/main/plugins.json`
  - Source: `apps/studio/src/services/plugin/PluginRepositoryService.ts:60-66`

```typescript
async fetchRegistry() {
  return await this.fetchJson(
    "beekeeper-studio",
    "beekeeper-studio-plugins",
    "plugins.json"
  );
}
```

**Local Plugin Scanning**
- **Directory Scanning**: File system scan for installed plugins
  - Location: `{userDirectory}/plugins/`
  - Implementation: `apps/studio/src/services/plugin/PluginFileManager.ts:228-267`

```typescript
scanPlugins(): Manifest[] {
  const manifests: Manifest[] = [];

  if (!fs.existsSync(this.options.pluginsDirectory)) {
    fs.mkdirSync(this.options.pluginsDirectory, { recursive: true });
  }

  for (const dir of fs.readdirSync(this.options.pluginsDirectory)) {
    // ... reads manifest.json from each directory
  }

  return manifests;
}
```

**Manifest-based Configuration**
- Each plugin requires a `manifest.json` file
- Manifest defines plugin metadata, capabilities, views, and menu items
- Two manifest versions supported: V0 (legacy) and V1 (current)

### Loading Mechanism

**Two-Stage Loading Process**

**Stage 1: Backend Loading (Electron Main/Utility Process)**
- Class: `PluginManager` (`apps/studio/src/services/plugin/PluginManager.ts`)
- Responsibilities:
  - Download and extract plugin archives from GitHub releases
  - Scan local plugin directory for installed plugins
  - Validate plugin compatibility (minAppVersion check)
  - Manage plugin lifecycle (install, update, uninstall)
  - Auto-update plugins if enabled

```typescript
async initialize() {
  if (this.initialized) {
    log.warn("Calling initialize when already initialized");
    return;
  }

  const installedPlugins = this.fileManager.scanPlugins();
  await this.loadPluginSettings();

  this.plugins = installedPlugins.map((manifest) => ({
    manifest,
    loadable: this.isPluginLoadable(manifest),
  }));

  this.initialized = true;

  // Auto-install preinstalled plugins
  for (const id of PluginManager.PREINSTALLED_PLUGINS) {
    if (this.pluginSettings[id]) continue;
    await this.installPlugin(id);
  }

  // Auto-update plugins if enabled
  for (const plugin of installedPlugins) {
    if (
      this.pluginSettings[plugin.id]?.autoUpdate &&
      (await this.checkForUpdates(plugin.id))
    ) {
      await this.updatePlugin(plugin.id);
    }
  }
}
```

**Stage 2: Frontend Loading (Renderer Process)**
- Class: `WebPluginManager` (`apps/studio/src/services/plugin/web/WebPluginManager.ts`)
- Responsibilities:
  - Fetch plugin list from backend via IPC
  - Create `WebPluginLoader` instances for each plugin
  - Manage plugin view instances (iframes)
  - Handle plugin notifications and communication

```typescript
async initialize() {
  if (this.initialized) {
    log.warn("Calling initialize when already initialized");
    return;
  }

  await this.utilityConnection.send("plugin/waitForInit");

  this.plugins = await this.utilityConnection.send("plugin/plugins");

  for (const { loadable, manifest } of this.plugins) {
    if (!loadable) {
      log.warn(`Plugin "${manifest.id}" is not loadable. Skipping...`);
      continue;
    }
    if (window.bksConfig.plugins[manifest.id]?.disabled) {
      log.info(`Plugin "${manifest.id}" is disabled. Skipping...`);
      continue;
    }
    try {
      await this.loadPlugin(manifest);
    } catch (e) {
      log.error(`Failed to load plugin: ${manifest.id}`, e);
    }
  }

  this.initialized = true;
}
```

**Dynamic Import via Custom Protocol**
- Plugin assets served via custom Electron protocol: `plugin://`
- Protocol handler: `apps/studio/src/background/lib/electron/ProtocolBuilder.ts:74-113`

```typescript
createPluginProtocol: () => {
  protocol.registerBufferProtocol("plugin", (request, respond) => {
    const url = new URL(request.url);
    const pluginId = url.host;
    const pathName = path.join(pluginId, url.pathname);
    const normalized = path.normalize(pathName)
    const fullPath = path.join(platformInfo.userDirectory, "plugins", normalized)

    if (bksConfig.get(`plugins.${pluginId}.disabled`)) {
      respond({ error: -20 }) // blocked by client
      return;
    }

    readFile(fullPath, (error, data) => {
      // ... serves plugin files
    })
  });
}
```

---

## 3. Plugin Registration

### Registry Object / Manager

**PluginRegistry** (`apps/studio/src/services/plugin/PluginRegistry.ts`)
- Caches plugin registry entries and repository information
- Fetches plugin metadata from GitHub
- Lazy loads and caches repository data

```typescript
export default class PluginRegistry {
  private entries: PluginRegistryEntry[] = [];
  private repositories: Record<string, PluginRepository> = {};

  constructor(private readonly repositoryService: PluginRepositoryService) {}

  async getEntries() {
    if (this.entries.length === 0) {
      this.entries = await this.repositoryService.fetchRegistry();
    }
    return this.entries;
  }

  async getRepository(pluginId: string): Promise<PluginRepository> {
    if (Object.hasOwn(this.repositories, pluginId)) {
      return this.repositories[pluginId];
    }
    return await this.reloadRepository(pluginId);
  }
}
```

### Registration Process

**Backend Registration**
1. Plugin scanned from filesystem → `PluginFileManager.scanPlugins()`
2. Manifest parsed → validated → stored in `PluginManager.plugins[]`
3. Loadability check → `isPluginLoadable(manifest)` checks `minAppVersion`
4. Plugin context created:

```typescript
this.plugins = installedPlugins.map((manifest) => ({
  manifest,
  loadable: this.isPluginLoadable(manifest),
}));
```

**Frontend Registration**
1. Backend plugins fetched → `utilityConnection.send("plugin/plugins")`
2. For each loadable plugin → `WebPluginLoader` created
3. Views registered → `pluginStore.addTabTypeConfigs(manifest, views)`
4. Menu items registered → `menu.register(views, menu)`

```typescript
private async loadPlugin(manifest: Manifest) {
  if (this.loaders.has(manifest.id)) {
    log.warn(`Plugin "${manifest.id}" already loaded. Skipping...`);
    return this.loaders.get(manifest.id);
  }

  const loader = new WebPluginLoader({
    manifest,
    store: this.pluginStore,
    utility: this.utilityConnection,
    log: rawLog.scope(`Plugin:${manifest.id}`),
    appVersion: this.appVersion,
  });
  await loader.load();
  this.loaders.set(manifest.id, loader);
  return loader;
}
```

### Naming Conventions / Metadata

**Plugin Identifier**: `manifest.id` (e.g., `"bks-ai-shell"`)

**Release Naming Convention**:
- Archive filename: `{manifest.id}-{manifest.version}.zip`
- Example: `bks-ai-shell-1.0.0.zip`

**Directory Structure**:
```
{userDirectory}/plugins/
  └── {plugin-id}/
      ├── manifest.json
      ├── index.html
      └── ... (other plugin files)
```

---

## 4. Plugin Interface / Contract

### Required Manifest Fields

**ManifestV1** (`apps/studio/src/services/plugin/types.ts:130-135`):

```typescript
export type ManifestV1 = {
  manifestVersion: 1;
  id: string;                    // Unique plugin identifier
  name: string;                  // Display name
  author: string | {             // Author info
    name: string;
    url: string;
  };
  description: string;           // Plugin description
  version: string;               // Semantic version
  minAppVersion?: string;        // Minimum Beekeeper Studio version
  icon?: string;                 // Material UI icon name
  pluginEntryDir?: string;       // Root directory for plugin files

  capabilities: {
    views: PluginView[];         // UI views/tabs
    menu: PluginMenuItem[];      // Menu items
  };

  settings?: {                   // (Not yet implemented)
    id: string;
    name: string;
    type: "string" | "number" | "boolean";
    description?: string;
    default: string | number | boolean;
  }[];

  permissions?: (                // (Not yet implemented)
    | "run-custom-queries"
    | "create-entities"
    | "edit-entities"
  )[];
}
```

### Required View Definition

**PluginView** (`apps/studio/src/services/plugin/types.ts:17-26`):

```typescript
export type PluginView = {
  id: string;                    // View identifier
  name: string;                  // Display name
  type: `${TabType}-tab`;        // "shell-tab" | "base-tab"
  entry: string;                 // HTML entry point (e.g., "index.html")
};
```

**Tab Types**:
- `shell-tab`: Two-part UI with iframe (top) + collapsible table (bottom)
- `base-tab`: Plain tab with only iframe content

### Required Menu Item Definition

**PluginMenuItem** (`apps/studio/src/services/plugin/types.ts:51-75`):

```typescript
export interface PluginMenuItem {
  command: string;                           // Command identifier
  name: string;                              // Display label
  view: string;                              // View ID to open
  placement: PluginMenuItemPlacement |       // UI placement(s)
              PluginMenuItemPlacement[];
  group?: string;                            // (Planned) Group identifier
  order?: number;                            // (Planned) Sort order
}
```

### Communication Contract

**Request/Response Pattern** (via postMessage):

```typescript
// Request from plugin
{
  id: string;        // Unique request ID
  name: string;      // Action name (e.g., "getTables", "runQuery")
  args: object;      // Action-specific arguments
}

// Response to plugin
{
  id: string;        // Matching request ID
  result?: any;      // Action result
  error?: Error;     // Error if failed
}
```

**Notification Pattern** (one-way):

```typescript
{
  name: string;      // Event name (e.g., "themeChanged")
  args: object;      // Event-specific data
}
```

---

## 5. Plugin Lifecycle

### Phase 1: Installation (Backend)

**Triggered by**: `PluginManager.installPlugin(id)`

**Steps**:
1. Fetch plugin repository info from GitHub
2. Validate `minAppVersion` compatibility
3. Download `.zip` archive from GitHub release
4. Extract to temporary directory
5. Copy to final location: `{userDirectory}/plugins/{id}/`
6. Parse and store manifest
7. Create plugin context (manifest + loadable status)
8. Save plugin settings (auto-update enabled by default)

**Code**: `apps/studio/src/services/plugin/PluginManager.ts:120-176`

### Phase 2: Initialization (Backend)

**Triggered by**: `PluginManager.initialize()` on app startup

**Steps**:
1. Scan plugins directory for installed plugins
2. Load plugin settings from database
3. Create plugin contexts for all installed plugins
4. Auto-install preinstalled plugins (e.g., `bks-ai-shell`)
5. Auto-update plugins if enabled and updates available

**Code**: `apps/studio/src/services/plugin/PluginManager.ts:48-85`

### Phase 3: Loading (Frontend)

**Triggered by**: `WebPluginManager.initialize()` on renderer startup

**Steps**:
1. Wait for backend plugin manager initialization
2. Fetch plugin list from backend via IPC
3. For each loadable, non-disabled plugin:
   - Create `WebPluginLoader` instance
   - Register event listeners (window.message, tablesChanged)
   - Register views as tab types
   - Register menu items in appropriate placements
   - Call `onReady` listeners

**Code**: `apps/studio/src/services/plugin/web/WebPluginLoader.ts:65-89`

```typescript
async load(manifest?: Manifest) {
  this.log.info("Loading plugin", this.manifest);

  // Add event listener for messages from iframe
  window.addEventListener("message", this.handleMessage);

  const { views, menu } = isManifestV0(this.context.manifest)
    ? mapViewsAndMenuFromV0ToV1(this.context.manifest)
    : this.context.manifest.capabilities;

  this.pluginStore.addTabTypeConfigs(this.context.manifest, views);
  this.menu.register(views, menu);

  if (!this.listening) {
    this.registerEvents();
    this.onReadyListeners.forEach((fn) => fn());
  }
}
```

### Phase 4: View Instantiation (Runtime)

**Triggered by**: User opens plugin tab or menu item

**Steps**:
1. User clicks menu item or tab opener
2. Host app creates new tab with plugin view context
3. Vue component mounts iframe with `plugin://{id}/{entry}` URL
4. Component calls `WebPluginManager.registerIframe()` before load
5. IFrame loads, plugin JavaScript executes
6. Plugin sends initial requests (e.g., `getAppInfo`, `getViewContext`)

**Code**: `apps/studio/src/services/plugin/web/WebPluginManager.ts:99-105`

```typescript
registerIframe(pluginId: string, iframe: HTMLIFrameElement, context: PluginViewContext) {
  const loader = this.loaders.get(pluginId);
  if (!loader) {
    throw new Error("Plugin not found: " + pluginId);
  }
  loader.registerViewInstance({ iframe, context });
}
```

### Phase 5: Execution (Runtime)

**Triggered by**: Plugin sends postMessage requests

**Steps**:
1. Plugin iframe sends postMessage to host
2. `WebPluginLoader.handleMessage()` receives message
3. If message has `id` → handle as request
4. Execute request handler → check permissions
5. Run action (e.g., query database, get tables)
6. Apply `modifyResult` callbacks (for view-specific transformations)
7. Send response back to iframe via postMessage
8. Execute `after` callbacks (for side effects)

**Code**: `apps/studio/src/services/plugin/web/WebPluginLoader.ts:117-275`

### Phase 6: Deactivation/Unload

**Unload (without uninstall)**:
- Called when plugin is reloaded
- Removes event listeners
- Unregisters menu items
- Removes tab type configurations
- Does NOT dispose loader

**Code**: `apps/studio/src/services/plugin/web/WebPluginLoader.ts:356-365`

```typescript
async unload() {
  window.removeEventListener("message", this.handleMessage);

  const { views, menu } = isManifestV0(this.context.manifest)
    ? mapViewsAndMenuFromV0ToV1(this.context.manifest)
    : this.context.manifest.capabilities;

  this.menu.unregister(views, menu);
  this.pluginStore.removeTabTypeConfigs(this.context.manifest, views);
}
```

**Dispose (on uninstall)**:
- Called when plugin is uninstalled
- Unregisters all events
- Calls `onDispose` listeners
- Loader instance removed from map

**Code**: `apps/studio/src/services/plugin/web/WebPluginLoader.ts:381-384`

### Phase 7: Uninstallation (Backend)

**Triggered by**: `PluginManager.uninstallPlugin(id)`

**Steps**:
1. Acquire plugin lock (prevents concurrent operations)
2. Delete plugin directory from filesystem
3. Remove plugin from `plugins[]` array
4. Release plugin lock

**Code**: `apps/studio/src/services/plugin/PluginManager.ts:184-196`

---

## 6. Extension Points

### 1. Tab Views

**Extension Point**: `capabilities.views[]`

**Binds via**: Manifest view definition

**Tab Types**:
- `shell-tab`: Query-like tab with iframe + collapsible results table
- `base-tab`: Simple iframe-only tab

**Registration**: `apps/studio/src/services/plugin/web/PluginStoreService.ts:118-135`

```typescript
addTabTypeConfigs(manifest: Manifest, views: PluginView[]): void {
  views.forEach((view) => {
    const ref: TabTypeConfig.PluginRef = {
      pluginId: manifest.id,
      pluginTabTypeId: view.id,
    };
    const type: PluginTabType = view.type.includes("shell")
      ? "plugin-shell"
      : "plugin-base";
    const config: TabTypeConfig.PluginConfig = {
      ...ref,
      type,
      name: manifest.name,
      icon: manifest.icon,
    };
    this.store.commit("tabs/addTabTypeConfig", config);
  });
}
```

### 2. Menu Items (16 Placements)

**Extension Point**: `capabilities.menu[]`

**Placements**:
1. `newTabDropdown` - New tab dropdown
2. `menubar.tools` - Tools menu in menubar
3. `editor.query.context` - Query editor context menu
4. `results.cell.context` - Results table cell context menu
5. `results.columnHeader.context` - Results column header context menu
6. `results.rowHeader.context` - Results row header context menu
7. `results.corner.context` - Results table corner context menu
8. `tableTable.cell.context` - Table viewer cell context menu
9. `tableTable.columnHeader.context` - Table viewer column header
10. `tableTable.rowHeader.context` - Table viewer row header
11. `tableTable.corner.context` - Table viewer corner
12. `tab.query.header.context` - Query tab header context menu
13. `tab.table.header.context` - Table tab header context menu
14. `entity.table.context` - Table entity context menu
15. `entity.schema.context` - Schema entity context menu
16. `entity.routine.context` - Routine entity context menu
17. `structure.statusbar.menu` - Structure view status bar button

**Factory Pattern**: `apps/studio/src/services/plugin/web/PluginMenuFactories.ts:148-612`

Each placement has a factory that creates menu handlers:

```typescript
const pluginMenuFactories: MenuFactories = {
  "menubar.tools": {
    create(context, menuItem) {
      const id = `${context.manifest.id}-${menuItem.command}`;
      return {
        add() {
          context.store.addMenuBarItem({
            id,
            label: menuItem.name,
            parentId: "tools",
            disableWhenDisconnected: true,
            action: {
              event: AppEvent.newCustomTab,
              args: context.store.buildPluginTabInit({
                manifest: context.manifest,
                viewId: menuItem.view,
                command: menuItem.command,
              }),
            },
          });
        },
        remove: () => context.store.removeMenuBarItem(id),
      };
    },
  },
  // ... 16 more placements
};
```

### 3. Plugin API Actions (27 Actions)

**Request Actions** (`apps/studio/src/services/plugin/web/WebPluginLoader.ts:145-261`):

**Read Actions**:
- `getTables` - Get tables in schema
- `getColumns` - Get columns for table
- `getTableKeys` - Get table foreign/primary keys
- `getTableIndexes` - Get table indexes
- `getPrimaryKeys` - Get primary keys
- `getAppInfo` - Get theme and app version
- `getViewContext` - Get current view context
- `getConnectionInfo` - Get database connection info
- `getData` - Get plugin-specific data (unencrypted)
- `getEncryptedData` - Get plugin-specific data (encrypted)
- `clipboard.readText` - Read from clipboard
- `checkForUpdate` - Check if plugin update available
- `getViewState` - Get view-specific state

**Write Actions**:
- `runQuery` - Execute SQL query
- `setData` - Store plugin data (unencrypted)
- `setEncryptedData` - Store plugin data (encrypted)
- `clipboard.writeText` - Write to clipboard
- `setViewState` - Save view-specific state

**UI Actions**:
- `expandTableResult` - Expand/collapse results table (shell tabs)
- `setTabTitle` - Change tab title
- `openExternal` - Open URL in browser
- `openTab` - Open new tab (query, tableStructure, tableTable)

### 4. Notification Events

**Host → Plugin Notifications**:
- `themeChanged` - Theme/palette changed
- `tablesChanged` - Table list changed
- `broadcast` - Message from another view of same plugin

**Plugin → Host Notifications** (`apps/studio/src/services/plugin/web/WebPluginLoader.ts:277-325`):
- `windowEvent` - Trigger window event (keyboard, mouse, pointer)
- `pluginError` - Report plugin error to host
- `broadcast` - Send message to other plugin views

### 5. Data Storage

**Extension Point**: Plugin-specific key-value storage

**Storage Types**:
- **Unencrypted**: `getData(key)` / `setData(key, value)`
- **Encrypted**: `getEncryptedData(key)` / `setEncryptedData(key, value)`

**Implementation**: SQLite database via models:
- `apps/studio/src/common/appdb/models/PluginData.ts`
- `apps/studio/src/common/appdb/models/EncryptedPluginData.ts`

---

## 7. Configuration & Metadata

### Plugin Manifest

**Location**: `{pluginDirectory}/manifest.json`

**Format**: JSON

**Example**:
```json
{
  "manifestVersion": 1,
  "id": "bks-ai-shell",
  "name": "AI Shell",
  "author": {
    "name": "Beekeeper Studio",
    "url": "https://beekeeperstudio.io"
  },
  "description": "AI-powered SQL assistant",
  "version": "1.0.0",
  "minAppVersion": "5.3.0",
  "icon": "psychology",
  "pluginEntryDir": "dist",
  "capabilities": {
    "views": [
      {
        "id": "ai-shell",
        "name": "AI Shell",
        "type": "shell-tab",
        "entry": "index.html"
      }
    ],
    "menu": [
      {
        "command": "open-ai-shell",
        "name": "AI Shell",
        "view": "ai-shell",
        "placement": ["newTabDropdown", "menubar.tools"]
      }
    ]
  }
}
```

### Plugin Settings

**Storage**: SQLite database via `UserSetting` model

**Settings Key**: `"pluginSettings"`

**Structure**:
```typescript
{
  [pluginId: string]: {
    autoUpdate: boolean;
    disabled?: boolean;
  }
}
```

**Location**: `apps/studio/src/services/plugin/PluginManager.ts:248-267`

### App Configuration

**Disable Plugin**:
```javascript
// In bksConfig
plugins: {
  "plugin-id": {
    disabled: true
  }
}
```

**Checked at**:
- Protocol handler: `apps/studio/src/background/lib/electron/ProtocolBuilder.ts:83`
- Plugin loading: `apps/studio/src/services/plugin/web/WebPluginManager.ts:41`

### Hot Reload

**Supported**: Yes (via reload functionality)

**Method**: `WebPluginManager.reloadPlugin(id, manifest?)`

**Process**:
1. Unload plugin (remove listeners, menu items)
2. Reload with new manifest (if provided)
3. Re-register views and menu items

**Code**: `apps/studio/src/services/plugin/web/WebPluginManager.ts:87-94`

---

## 8. Security, Isolation & Error Handling

### Sandboxing

**IFrame Sandboxing**:
- Plugins run in iframes with sandbox attributes
- Communication limited to postMessage API
- No direct access to Node.js APIs or Electron

**Custom Protocol**:
- Plugin assets served via `plugin://` protocol
- Protocol handler validates plugin not disabled before serving
- Path normalization prevents directory traversal

**Code**: `apps/studio/src/background/lib/electron/ProtocolBuilder.ts:74-113`

```typescript
createPluginProtocol: () => {
  protocol.registerBufferProtocol("plugin", (request, respond) => {
    const url = new URL(request.url);
    const pluginId = url.host;
    const pathName = path.join(pluginId, url.pathname);
    const normalized = path.normalize(pathName)
    const fullPath = path.join(platformInfo.userDirectory, "plugins", normalized)

    if (bksConfig.get(`plugins.${pluginId}.disabled`)) {
      respond({ error: -20 }) // blocked by client
      return;
    }
    // ... serve file
  });
}
```

### Validation

**Manifest Validation**:
- Manifest must exist and be valid JSON
- Parsed during scan: `PluginFileManager.scanPlugins()`

**Version Compatibility**:
- `minAppVersion` checked before loading
- Uses `semver` for version comparison

**Code**: `apps/studio/src/services/plugin/PluginManager.ts:112-117`

```typescript
isPluginLoadable(manifest: Manifest): boolean {
  if (!manifest.minAppVersion) {
    return true;
  }
  return semver.lte(
    semver.coerce(manifest.minAppVersion),
    semver.coerce(this.options.appVersion)
  );
}
```

### Permission System

**Status**: Defined but not implemented

**Planned Permissions** (`apps/studio/src/services/plugin/types.ts:123-127`):
- `run-custom-queries`
- `create-entities`
- `edit-entities`

**Permission Check Stub** (`apps/studio/src/services/plugin/web/WebPluginLoader.ts:374-377`):

```typescript
checkPermission(data: PluginRequestData) {
  // do nothing on purpose
  // if not permitted, throw error
}
```

### Error Handling

**Plugin Loading Errors**:
- Try-catch around plugin loading
- Errors logged, plugin skipped
- App continues loading other plugins

**Code**: `apps/studio/src/services/plugin/web/WebPluginManager.ts:45-49`

```typescript
try {
  await this.loadPlugin(manifest);
} catch (e) {
  log.error(`Failed to load plugin: ${manifest.id}`, e);
}
```

**Plugin Request Errors**:
- Try-catch around request handling
- Error returned in response object
- Plugin can handle error

**Code**: `apps/studio/src/services/plugin/web/WebPluginLoader.ts:142-268`

```typescript
try {
  this.checkPermission(request);

  switch (request.name) {
    // ... handle actions
  }

  for (const callback of modifyResultCallbacks) {
    response.result = await callback(response.result);
  }
} catch (e) {
  response.error = e;
}

this.postMessage(source, response);
```

**Plugin Notification Errors**:
- Plugin can send `pluginError` notification
- Logged by host but doesn't crash app

**Code**: `apps/studio/src/services/plugin/web/WebPluginLoader.ts:303-306`

```typescript
case "pluginError": {
  this.log.error(`Received plugin error: ${notification.args.message}`, notification.args);
  break;
}
```

**Plugin Lock Mechanism**:
- Prevents concurrent install/update/uninstall operations
- Uses simple array-based locking

**Code**: `apps/studio/src/services/plugin/PluginManager.ts:223-242`

```typescript
private async withPluginLock<T>(
  id: string,
  callback: () => T | Promise<T>
): Promise<T> {
  if (this.pluginLocks.includes(id)) {
    throw new Error(`Plugin "${id}" is not idle.`);
  }

  this.pluginLocks.push(id);

  try {
    ret = await callback();
  } finally {
    this.pluginLocks = this.pluginLocks.filter((lock) => lock !== id);
  }

  return ret;
}
```

---

## 9. Dependency Management

### Plugin Dependencies

**No Explicit Dependency Declaration**:
- Plugins cannot declare dependencies on other plugins
- Each plugin is self-contained
- No npm-style dependency resolution

### Host API Dependency

**NPM Package**: `@beekeeperstudio/plugin`
- Provides TypeScript types for plugin API
- Helper functions for postMessage communication
- Not required but strongly recommended

**Import in Plugin**:
```typescript
import { getTables, runQuery } from '@beekeeperstudio/plugin';
```

### Service Injection (Host Side)

**WebPluginContext** (`apps/studio/src/services/plugin/types.ts:171-177`):

```typescript
export type WebPluginContext = {
  manifest: Manifest;
  store: PluginStoreService;      // Vuex bridge
  utility: UtilityConnection;     // IPC to utility process
  log: ReturnType<typeof rawLog.scope>;  // Scoped logger
  appVersion: string;
}
```

**Dependency Injection**: Constructor-based

```typescript
const loader = new WebPluginLoader({
  manifest,
  store: this.pluginStore,
  utility: this.utilityConnection,
  log: rawLog.scope(`Plugin:${manifest.id}`),
  appVersion: this.appVersion,
});
```

### Version Constraints

**App Version Constraint**: `manifest.minAppVersion`
- Semantic versioning
- Loader checks compatibility
- Incompatible plugins not loaded

**No Plugin-to-Plugin Versioning**:
- Plugins cannot depend on specific versions of other plugins
- No version negotiation between plugins

---

## 10. Architecture Diagram

```mermaid
flowchart TB
    subgraph "Remote (GitHub)"
        Registry[Plugin Registry<br/>plugins.json]
        Repo[Plugin Repository<br/>Releases + Manifest]
    end

    subgraph "Electron Main/Utility Process"
        PRS[PluginRepositoryService<br/>Octokit API]
        PR[PluginRegistry<br/>Cache]
        PM[PluginManager<br/>Lifecycle Management]
        PFM[PluginFileManager<br/>Download & Scan]
        FS[(Filesystem<br/>plugins/)]
        DB[(SQLite<br/>Settings & Data)]
    end

    subgraph "IPC Bridge"
        PH[PluginHandlers<br/>IPC Handlers]
        UC[UtilityConnection<br/>IPC Client]
    end

    subgraph "Electron Renderer Process"
        WPM[WebPluginManager<br/>Frontend Orchestrator]
        WPL[WebPluginLoader<br/>Per-Plugin Loader]
        PMM[PluginMenuManager<br/>Menu Registration]
        PSS[PluginStoreService<br/>Vuex Bridge]

        subgraph "UI Components"
            IFrame[Plugin IFrame<br/>Sandboxed View]
        end
    end

    subgraph "Plugin Code (Sandboxed)"
        PJS[Plugin JavaScript<br/>Custom Logic]
        API[@beekeeperstudio/plugin<br/>Helper Library]
    end

    Registry --> PRS
    Repo --> PRS
    PRS --> PR
    PR --> PM
    PFM --> FS
    PM --> PFM
    PM --> DB

    PM --> PH
    PH <-.IPC.-> UC
    UC --> WPM

    WPM --> WPL
    WPL --> PMM
    WPL --> PSS
    WPL <-.postMessage.-> IFrame

    IFrame --> PJS
    PJS --> API
    API -.postMessage.-> WPL

    FS -.plugin://.-> IFrame

    classDef backend fill:#e1f5ff,stroke:#01579b
    classDef frontend fill:#fff3e0,stroke:#e65100
    classDef plugin fill:#f3e5f5,stroke:#4a148c
    classDef storage fill:#e8f5e9,stroke:#1b5e20

    class PRS,PR,PM,PFM backend
    class WPM,WPL,PMM,PSS,IFrame frontend
    class PJS,API plugin
    class FS,DB storage
```

### Component Flow

**Installation Flow**:
```
User → WebPluginManager.install(id)
  → UtilityConnection.send("plugin/install")
    → PluginHandlers["plugin/install"]
      → PluginManager.installPlugin(id)
        → PluginRegistry.getRepository(id)
          → PluginRepositoryService.fetchPluginRepository()
            → GitHub API
        → PluginFileManager.download()
          → Download .zip
          → Extract to plugins/{id}/
        → PluginManager.plugins.push()
        → Save settings to DB
  → WebPluginManager.loadPlugin(manifest)
    → Create WebPluginLoader
    → Register views & menus
```

**Runtime Request Flow**:
```
Plugin IFrame → postMessage({ id, name, args })
  → window.message event
    → WebPluginLoader.handleMessage()
      → WebPluginLoader.handleViewRequest()
        → Execute action (e.g., getTables, runQuery)
        → Apply modifyResult callbacks
        → postMessage(response)
  → Plugin receives response
```

---

## 11. Improvement Recommendations

### 1. Performance Optimizations

**Lazy Loading**:
- Currently all plugins loaded on startup
- **Recommendation**: Load plugins on-demand when first accessed
- **Benefit**: Faster app startup, lower memory usage

**Plugin Bundle Optimization**:
- No guidance on plugin bundle size
- **Recommendation**:
  - Document bundle size best practices
  - Add bundle size warnings in plugin manager
  - Support code splitting in plugins
- **Benefit**: Faster plugin loading

**Caching**:
- Registry fetched on every check
- **Recommendation**:
  - Add TTL-based caching for registry
  - Implement conditional requests (ETag/Last-Modified)
- **Benefit**: Reduce network requests

### 2. Stability Improvements

**Plugin Crash Isolation**:
- IFrame provides some isolation but no crash recovery
- **Recommendation**:
  - Implement iframe crash detection
  - Auto-reload crashed plugins with backoff
  - Provide user feedback on plugin crashes
- **Benefit**: Better user experience, prevent data loss

**Timeout Handling**:
- Plugin requests have no timeout
- **Recommendation**:
  - Add configurable timeout for plugin requests
  - Show loading indicator for long-running operations
  - Allow user to cancel long-running requests
- **Benefit**: Prevent hanging UI

**Dependency Resolution**:
- No dependency management between plugins
- **Recommendation**:
  - Add `dependencies` field to manifest
  - Implement dependency resolution algorithm
  - Show dependency graph in plugin manager
- **Benefit**: Enable plugin ecosystems

### 3. Cleaner Extension Points

**API Versioning**:
- No API versioning mechanism
- **Recommendation**:
  - Add `apiVersion` field to manifest
  - Support multiple API versions simultaneously
  - Provide migration guides for API changes
- **Benefit**: Backward compatibility

**Plugin Communication**:
- Limited to broadcast within same plugin
- **Recommendation**:
  - Add cross-plugin event bus
  - Implement plugin-to-plugin message passing
  - Add permission system for plugin communication
- **Benefit**: Enable plugin composition

**Type Safety**:
- Plugin API types defined separately
- **Recommendation**:
  - Auto-generate TypeScript types from manifest
  - Provide CLI tool for scaffolding plugins
  - Add manifest schema validation
- **Benefit**: Better DX, fewer runtime errors

### 4. Better Lifecycle APIs

**Install Hooks**:
- No hooks for plugin lifecycle events
- **Recommendation**:
  - Add `onInstall`, `onUpdate`, `onUninstall` hooks
  - Allow plugins to run migration scripts
  - Provide cleanup mechanism for uninstall
- **Benefit**: Better data management

**View Lifecycle**:
- No view-specific lifecycle hooks
- **Recommendation**:
  - Add `onViewMount`, `onViewUnmount` events
  - Provide view instance tracking API
  - Add `beforeUnload` for unsaved changes
- **Benefit**: Better resource management

**Hot Reload**:
- Manual reload only
- **Recommendation**:
  - Add file watching for development mode
  - Auto-reload on plugin file changes
  - Preserve plugin state during reload
- **Benefit**: Better development experience

### 5. Safer Plugin Execution

**Permission System**:
- Defined but not implemented
- **Recommendation**:
  - Implement permission checks for sensitive APIs
  - Add user-facing permission prompts
  - Allow users to review/revoke permissions
  - Document security model clearly
- **Benefit**: Security, user trust

**Content Security Policy**:
- No CSP for iframes
- **Recommendation**:
  - Add strict CSP headers for plugin iframes
  - Whitelist allowed resources in manifest
  - Block inline scripts by default
- **Benefit**: Prevent XSS attacks

**Plugin Signing**:
- No signature verification
- **Recommendation**:
  - Sign plugin releases with GPG
  - Verify signatures before installation
  - Add trusted publisher badges
- **Benefit**: Prevent malware

**Audit Logging**:
- Limited logging of plugin actions
- **Recommendation**:
  - Log all sensitive plugin API calls
  - Add audit log viewer in settings
  - Allow export of audit logs
- **Benefit**: Security monitoring, debugging

### 6. Developer Experience

**CLI Tooling**:
- No official CLI for plugin development
- **Recommendation**:
  - Create `@beekeeperstudio/plugin-cli` package
  - Add commands: `init`, `dev`, `build`, `publish`
  - Provide project templates
- **Benefit**: Faster plugin development

**Documentation**:
- Documentation exists but could be expanded
- **Recommendation**:
  - Add interactive API explorer
  - Provide more plugin examples
  - Document common patterns (auth, state management)
  - Add troubleshooting guide
- **Benefit**: Lower barrier to entry

**Testing**:
- No testing utilities for plugins
- **Recommendation**:
  - Provide mock host environment for testing
  - Add test utilities package
  - Document testing strategies
- **Benefit**: Higher quality plugins

### 7. Distribution

**Plugin Discovery**:
- Single centralized registry
- **Recommendation**:
  - Support multiple registries
  - Add search/filtering in plugin manager
  - Show plugin ratings/reviews
  - Add "featured" and "trending" sections
- **Benefit**: Better discoverability

**Update Notifications**:
- Auto-update or silent updates
- **Recommendation**:
  - Add update notification UI
  - Show changelog before update
  - Allow selective updates
  - Add rollback mechanism
- **Benefit**: User control, transparency

**Analytics**:
- No usage analytics
- **Recommendation**:
  - Add opt-in telemetry for plugin usage
  - Provide analytics dashboard for plugin authors
  - Track crashes and errors
- **Benefit**: Improve plugin quality

---

## Conclusion

Beekeeper Studio's plugin architecture is a well-designed hybrid system that successfully balances **extensibility**, **security**, and **developer experience**. The architecture demonstrates several strengths:

**Strengths**:
- Clean separation of concerns (file management, registry, loading)
- Strong sandboxing via iframes and custom protocol
- Rich extension points (16 menu placements, multiple tab types)
- Comprehensive API (27 actions + notifications)
- Version compatibility checks
- Auto-update mechanism

**Areas for Growth**:
- Implement permission system (already defined)
- Add plugin-to-plugin communication
- Improve developer tooling (CLI, testing)
- Add crash recovery and timeout handling
- Implement plugin signing for security

The architecture is production-ready and provides a solid foundation for a thriving plugin ecosystem. With the recommended improvements, it could become a best-in-class plugin system for Electron applications.
