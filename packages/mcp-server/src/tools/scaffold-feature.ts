import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { modelTemplate, type FieldDef } from "../templates/model.js";
import { VIEW_MODEL_STYLES, viewModelTemplate, type ViewModelStyle } from "../templates/viewmodel.js";
import { adapterTemplate, type Framework } from "../templates/adapter.js";

const FieldSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean", "string[]", "number[]"]),
  optional: z.boolean().optional(),
});

export function registerScaffoldFeatureTool(server: McpServer): void {
  server.registerTool(
    "scaffold_restful_feature",
    {
      description: "Generate a complete MVVM feature: Zod schema + RestfulApiModel + RestfulApiViewModel + framework adapter (React hook / Vue composable / vanilla controller / Angular service). Returns a map of file names to file contents.",
      inputSchema: {
        name: z
          .string()
          .describe("Feature/entity name in PascalCase (e.g. 'Product', 'BlogPost')"),
        endpoint: z
          .string()
          .describe("REST API endpoint (e.g. '/products')"),
        fields: z
          .array(FieldSchema)
          .describe("Entity fields (id is always included automatically)"),
        framework: z
          .enum(["react", "vue", "vanilla", "angular"])
          .describe("Target UI framework for the adapter layer"),
        apiBase: z
          .string()
          .optional()
          .describe("Base API URL (default: 'http://localhost:3000')"),
        viewModelStyle: z
          .enum(VIEW_MODEL_STYLES)
          .optional()
          .describe("ViewModel template style (default: 'restful-class')"),
      },
    },
    async ({ name, endpoint, fields, framework, apiBase, viewModelStyle }) => {
      const typedFields = fields as FieldDef[];
      const selectedViewModelStyle = (viewModelStyle ?? "restful-class") as ViewModelStyle;
      const modelCode = modelTemplate({ name, endpoint, fields: typedFields, apiBase });
      const vmCode = viewModelTemplate({
        name,
        modelClass: `${name}Model`,
        schemaModule: `./${name}Model.js`,
        style: selectedViewModelStyle,
      });
      const adapterCode = adapterTemplate({
        name,
        framework: framework as Framework,
        viewModelStyle: selectedViewModelStyle,
      });

      const adapterFileName =
        framework === "react"
          ? `use${name}.ts`
          : framework === "vue"
            ? `use${name}.ts`
            : framework === "angular"
              ? `${name}.service.ts`
              : `${name}Controller.ts`;

      const files: Record<string, string> = {
        [`${name}Model.ts`]: modelCode,
        [`${name}ViewModel.ts`]: vmCode,
        [adapterFileName]: adapterCode,
      };

      const sections = Object.entries(files)
        .map(([file, code]) => `### \`${file}\`\n\`\`\`typescript\n${code}\`\`\``)
        .join("\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `# ${name} Feature — ${framework} adapter\n`,
              "Create these files in your feature directory:\n",
              sections,
              "\n## Setup",
              "1. Install: `npm install @web-loom/mvvm-core rxjs zod`",
              `2. Import \`${name}Model\` and the generated \`${name}ViewModel\` export from their files`,
              framework === "react"
                ? `3. Use the \`use${name}()\` hook in your component`
                : framework === "vue"
                  ? `3. Call \`use${name}()\` inside your \`<script setup>\``
                  : framework === "angular"
                    ? `3. Provide \`${name}Service\` in your module providers`
                    : `3. Call \`create${name}Controller()\` and hold the reference`,
            ].join("\n"),
          },
        ],
      };
    }
  );
}
