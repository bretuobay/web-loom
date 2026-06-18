import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { formTemplate } from "../templates/form.js";

export function registerScaffoldFormTool(server: McpServer): void {
  server.registerTool(
    "scaffold_form",
    {
      description: "Generate a forms-core form setup with Zod validation schema, field registration, and submit handler. Requires @web-loom/forms-core.",
      inputSchema: {
        name: z
          .string()
          .describe("Form name in PascalCase (e.g. 'LoginForm', 'ProductCreate')"),
        fields: z.array(
          z.object({
            name: z.string().describe("Field name (camelCase)"),
            type: z
              .enum(["string", "number", "boolean", "email", "url"])
              .describe("Field type (affects Zod validator)"),
            label: z.string().optional().describe("Human-readable label"),
            required: z
              .boolean()
              .optional()
              .describe("Whether the field is required (default: true)"),
            minLength: z.number().optional().describe("Minimum string length"),
            maxLength: z.number().optional().describe("Maximum string length"),
          })
        ),
      },
    },
    async ({ name, fields }) => {
      const code = formTemplate({ name, fields });
      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Generated \`${name.toLowerCase()}Form\` — save as \`${name}Form.ts\`:\n`,
              "```typescript",
              code,
              "```",
              "\nFor React, subscribe to form state with useEffect or a dedicated hook.",
              "For Vue, use a ref and subscribe in onMounted.",
            ].join("\n"),
          },
        ],
      };
    }
  );
}
