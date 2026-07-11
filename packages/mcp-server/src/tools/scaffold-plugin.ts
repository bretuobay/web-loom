import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { pluginTemplate } from '../templates/plugin.js';

export function registerScaffoldPluginTool(server: McpServer): void {
  server.registerTool(
    'scaffold_plugin',
    {
      description:
        'Generate a web-loom plugin — PluginManifest and PluginModule with init/mount/unmount lifecycle hooks. Requires @web-loom/plugin-core.',
      inputSchema: {
        name: z.string().describe("Plugin name in camelCase (e.g. 'analyticsPlugin')"),
        id: z.string().describe("Unique plugin identifier (e.g. 'com.myapp.analytics')"),
        displayName: z.string().optional().describe('Human-readable plugin name'),
        routes: z
          .array(
            z.object({
              path: z.string().describe("Route path (e.g. '/analytics')"),
              componentName: z.string().describe('Component filename without extension'),
            }),
          )
          .optional()
          .describe('Routes this plugin registers'),
        menuItems: z
          .array(
            z.object({
              id: z.string(),
              label: z.string(),
              icon: z.string().optional(),
              path: z.string().optional(),
            }),
          )
          .optional()
          .describe('Menu items to add to the host app nav'),
      },
    },
    async ({ name, id, displayName, routes, menuItems }) => {
      const code = pluginTemplate({ name, id, displayName, routes, menuItems });
      return {
        content: [
          {
            type: 'text' as const,
            text: [
              `Generated plugin \`${name}\` — save as \`${name}/index.ts\`:\n`,
              '```typescript',
              code,
              '```',
              '\nRegister in the host app:',
              '```typescript',
              `import { PluginRegistry } from "@web-loom/plugin-core";`,
              `import { ${name}Manifest, ${name}Module } from "./plugins/${name}/index.js";`,
              '',
              `const registry = new PluginRegistry();`,
              `registry.register({ ...${name}Manifest, module: ${name}Module });`,
              '```',
            ].join('\n'),
          },
        ],
      };
    },
  );
}
