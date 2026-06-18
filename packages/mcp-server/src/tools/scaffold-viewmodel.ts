import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { viewModelTemplate } from "../templates/viewmodel.js";

const CustomCommandSchema = z.object({
  name: z.string().describe("Command property name (camelCase, e.g. 'archiveCommand')"),
  paramType: z
    .string()
    .optional()
    .describe("TypeScript type for the command parameter (default: 'void')"),
  resultType: z
    .string()
    .optional()
    .describe("TypeScript return type (default: 'void')"),
  description: z.string().optional().describe("Short description of what the command does"),
});

export function registerScaffoldViewModelTool(server: McpServer): void {
  server.registerTool(
    "scaffold_viewmodel",
    {
      description: "Generate a RestfulApiViewModel subclass. Includes built-in fetchCommand, createCommand, updateCommand, deleteCommand from the base class. Add customCommands for any additional actions.",
      inputSchema: {
        name: z
          .string()
          .describe("Entity name in PascalCase — must match the name used in scaffold_model (e.g. 'Product')"),
        modelClass: z
          .string()
          .describe("Model class name (e.g. 'ProductModel'). The ViewModel will import it from ./{modelClass}.js"),
        schemaModule: z
          .string()
          .optional()
          .describe("Override the schema import path (default: ./{name}Schema.js)"),
        customCommands: z
          .array(CustomCommandSchema)
          .optional()
          .describe("Extra commands beyond the built-in CRUD ones"),
      },
    },
    async ({ name, modelClass, schemaModule, customCommands }) => {
      const code = viewModelTemplate({ name, modelClass, schemaModule, customCommands });
      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Generated \`${name}ViewModel\` — save as \`${name}ViewModel.ts\`:\n`,
              "```typescript",
              code,
              "```",
              "\nBuilt-in commands from `RestfulApiViewModel`:",
              "- `fetchCommand` — load all items",
              "- `createCommand` — create a new item",
              "- `updateCommand` — update by id",
              "- `deleteCommand` — delete by id",
              "- `selectedItem$` — currently selected item observable",
            ].join("\n"),
          },
        ],
      };
    }
  );
}
