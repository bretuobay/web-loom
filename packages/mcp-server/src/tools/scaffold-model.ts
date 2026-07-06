import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MODEL_STYLES, modelTemplate } from "../templates/model.js";

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
      description: "Generate a web-loom Model with a Zod schema. Supports REST classes, REST config for factories, simple BaseModel state, and QueryCore cached lists.",
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
        style: z
          .enum(MODEL_STYLES)
          .optional()
          .describe("Model template style (default: 'restful-class')"),
      },
    },
    async ({ name, endpoint, fields, apiBase, style }) => {
      const selectedStyle = style ?? "restful-class";
      const code = modelTemplate({ name, endpoint, fields, apiBase, style: selectedStyle });
      const nextStep =
        selectedStyle === "restful-config"
          ? `\nNext step: run \`scaffold_viewmodel\` with \`style: "reactive-factory"\` and \`schemaModule: "./${name}Model.js"\`.`
          : selectedStyle === "base-state"
            ? `\nNext step: run \`scaffold_viewmodel\` with \`style: "base-commands"\` and \`modelClass: "${name}Model"\`.`
            : selectedStyle === "query-cache"
              ? `\nNext step: run \`scaffold_viewmodel\` with \`style: "active-signals-list"\` and \`modelClass: "${name}Model"\`.`
              : `\nNext step: run \`scaffold_viewmodel\` with \`modelClass: "${name}Model"\` to generate the ViewModel.`;
      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Generated \`${name}Model\` using \`${selectedStyle}\` — save as \`${name}Model.ts\`:\n`,
              "```typescript",
              code,
              "```",
              nextStep,
            ].join("\n"),
          },
        ],
      };
    }
  );
}
