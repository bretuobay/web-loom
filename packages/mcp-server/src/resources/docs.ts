import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PACKAGES = [
  { pkg: "mvvm-core", description: "Core MVVM library — BaseModel, BaseViewModel, RestfulApiModel, Command, CompositeCommand, ObservableCollection" },
  { pkg: "signals-core", description: "Reactive signal primitives — signal, computed, observe, ReadonlySignal" },
  { pkg: "query-core", description: "Data fetching and caching — QueryCore, EndpointOptions, CacheProviders" },
  { pkg: "store-core", description: "Minimal reactive state — createStore, PersistedStore, persistence adapters" },
  { pkg: "ui-core", description: "Headless UI behaviors — Dialog, Form, ListSelection, RovingFocus, DragDrop, UndoRedo" },
  { pkg: "forms-core", description: "Framework-agnostic forms — FormFactory, async validation, field dependencies" },
  { pkg: "plugin-core", description: "Plugin architecture — PluginRegistry, PluginManifest, PluginModule, PluginSDK" },
  { pkg: "event-bus-core", description: "Pub-sub event bus for cross-feature communication" },
  { pkg: "http-core", description: "HTTP client utilities and fetch wrappers" },
  { pkg: "router-core", description: "Framework-agnostic routing utilities" },
  { pkg: "storage-core", description: "Storage abstraction over localStorage and sessionStorage" },
  { pkg: "i18n-core", description: "Internationalization utilities" },
  { pkg: "notifications-core", description: "Notification system" },
] as const;

type PackageSlug = typeof PACKAGES[number]["pkg"];

async function readDoc(pkg: PackageSlug): Promise<string> {
  // Resolve from dist/resources/ → up to packages/ → into sibling package
  const readmePath = join(__dirname, "../../../", pkg, "README.md");
  try {
    return await readFile(readmePath, "utf8");
  } catch {
    return `# @web-loom/${pkg}\n\nDocumentation not available in this environment. Install the package or run from the web-loom monorepo to access README files.`;
  }
}

export function registerDocsResources(server: McpServer): void {
  for (const { pkg, description } of PACKAGES) {
    const uri = `web-loom://docs/${pkg}`;
    server.registerResource(
      `docs-${pkg}`,
      uri,
      { description, mimeType: "text/markdown" },
      async (_uri) => {
        const text = await readDoc(pkg as PackageSlug);
        return { contents: [{ uri, text, mimeType: "text/markdown" }] };
      }
    );
  }
}
