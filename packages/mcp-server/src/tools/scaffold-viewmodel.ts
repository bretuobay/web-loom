import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VIEW_MODEL_STYLES, viewModelTemplate } from "../templates/viewmodel.js";

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
      description: "Generate a web-loom ViewModel. Supports REST CRUD classes, reactive factory instances, command-focused BaseViewModels, and simple active/searchable list ViewModels.",
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
          .describe("Override the schema import path (default: ./{modelClass}.js)"),
        style: z
          .enum(VIEW_MODEL_STYLES)
          .optional()
          .describe("Template style (default: 'restful-class')"),
        dataType: z
          .string()
          .optional()
          .describe("Data type imported from schemaModule (default: {name}ListData)"),
        itemType: z
          .string()
          .optional()
          .describe("Item type for list/search templates (default: {name}Data)"),
        customCommands: z
          .array(CustomCommandSchema)
          .optional()
          .describe("Extra commands for 'restful-class' or 'base-commands' styles"),
      },
    },
    async ({ name, modelClass, schemaModule, style, dataType, itemType, customCommands }) => {
      const selectedStyle = style ?? "restful-class";
      const code = viewModelTemplate({
        name,
        modelClass,
        schemaModule,
        style: selectedStyle,
        dataType,
        itemType,
        customCommands,
      });
      const notes =
        selectedStyle === "restful-class"
          ? [
              "\nBuilt-in commands from `RestfulApiViewModel`:",
              "- `fetchCommand` — load all items",
              "- `createCommand` — create a new item",
              "- `updateCommand` — update by id",
              "- `deleteCommand` — delete by id",
              "- `selectedItem$` — currently selected item signal",
            ]
          : selectedStyle === "reactive-factory"
            ? [
                "\nFactory style expects a `${camelName}Config` export from the schema/model module.",
                "Use it when you only need the standard reactive REST ViewModel instance.",
              ]
            : selectedStyle === "base-commands"
              ? [
                  "\nBase command style is for domain-specific Model methods and custom commands.",
                  "Add `customCommands` for concrete command names and payload types.",
                ]
              : [
                  "\nActive signals list style is for searchable list screens with activation refresh behavior.",
                  "It expects the model to expose `data$` and a `fetch()` method.",
                ];
      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Generated \`${name}ViewModel\` using \`${selectedStyle}\` — save as \`${name}ViewModel.ts\`:\n`,
              "```typescript",
              code,
              "```",
              ...notes,
            ].join("\n"),
          },
        ],
      };
    }
  );
}
