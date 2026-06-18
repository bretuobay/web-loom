import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { modelTemplate } from "../templates/model.js";

const FieldSchema = z.object({
  name: z.string().describe("Field name (camelCase)"),
  type: z
    .enum(["string", "number", "boolean", "string[]", "number[]"])
    .describe("Field type"),
  optional: z.boolean().optional().describe("Whether the field is optional"),
});

export function registerScaffoldModelTool(server: McpServer): void {
  server.registerTool(
    "scaffold_model",
    {
      description: "Generate a RestfulApiModel subclass with a Zod schema for a given entity. Returns TypeScript source code ready to paste into a model file.",
      inputSchema: {
        name: z
          .string()
          .describe("Entity name in PascalCase (e.g. 'Product', 'UserProfile')"),
        endpoint: z
          .string()
          .describe("REST API endpoint path (e.g. '/products', '/users')"),
        fields: z.array(FieldSchema).describe("Entity fields (excluding 'id' which is always included)"),
        apiBase: z
          .string()
          .optional()
          .describe("Base URL for the API (default: 'http://localhost:3000')"),
      },
    },
    async ({ name, endpoint, fields, apiBase }) => {
      const code = modelTemplate({ name, endpoint, fields, apiBase });
      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Generated \`${name}Model\` — save as \`${name}Model.ts\`:\n`,
              "```typescript",
              code,
              "```",
              `\nNext step: run \`scaffold_viewmodel\` with \`modelClass: "${name}Model"\` to generate the ViewModel.`,
            ].join("\n"),
          },
        ],
      };
    }
  );
}
