import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerCreateMvvmFeaturePrompt(server: McpServer): void {
  server.registerPrompt(
    "create-mvvm-feature",
    {
      description: "Step-by-step guide for creating a complete MVVM feature using web-loom — from Zod schema through Model, ViewModel, to framework adapter.",
      argsSchema: {
        featureName: z.string().describe("Feature/entity name in PascalCase (e.g. 'Product', 'Invoice')"),
        endpoint: z.string().describe("REST API endpoint (e.g. '/api/products')"),
        fields: z.string().describe("Comma-separated field names and types, e.g. 'name:string, price:number, active:boolean'"),
        framework: z.enum(["react", "vue", "vanilla", "angular", "lit"]).describe("Target UI framework"),
      },
    },
    async ({ featureName, endpoint, fields, framework }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `I want to create a web-loom MVVM feature called "${featureName}" that connects to "${endpoint}".

**Fields**: ${fields}
**Framework**: ${framework}

Please follow these steps in order:

## Step 1 — Scaffold the Model
Use the \`scaffold_model\` tool with:
- name: "${featureName}"
- endpoint: "${endpoint}"
- fields: parse from "${fields}"

## Step 2 — Scaffold the ViewModel
Use the \`scaffold_viewmodel\` tool with:
- name: "${featureName}"
- modelClass: "${featureName}Model"

## Step 3 — Scaffold the Full Feature (Model + ViewModel + Framework Adapter)
Use the \`scaffold_restful_feature\` tool to get all files at once:
- name: "${featureName}"
- endpoint: "${endpoint}"
- fields: (same as above)
- framework: "${framework}"

## Step 4 — Review Architecture
After generating, verify:
1. The Model extends \`RestfulApiModel\` with the correct Zod schema
2. The ViewModel extends \`RestfulApiViewModel\` and calls \`super.dispose()\`
3. The ${framework} adapter disposes the ViewModel on unmount
4. Any custom commands are registered via \`this.registerCommand()\`

## Step 5 — Integration
Read \`web-loom://architecture/mvvm\` for the full integration guide.

Start with Step 1 now.`,
          },
        },
      ],
    })
  );
}
