export interface FieldDef {
  name: string;
  type: "string" | "number" | "boolean" | "string[]" | "number[]";
  optional?: boolean;
}

export interface ModelTemplateParams {
  name: string;
  endpoint: string;
  fields: FieldDef[];
  apiBase?: string;
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function zodFieldType(f: FieldDef): string {
  const base: Record<FieldDef["type"], string> = {
    string: "z.string()",
    number: "z.number()",
    boolean: "z.boolean()",
    "string[]": "z.array(z.string())",
    "number[]": "z.array(z.number())",
  };
  const expr = base[f.type] ?? "z.string()";
  return f.optional ? `${expr}.optional()` : expr;
}

export function modelTemplate(p: ModelTemplateParams): string {
  const { name, endpoint, fields, apiBase = "http://localhost:3000" } = p;
  const configName = `${lowerFirst(name)}Config`;
  const schemaFields = fields
    .map((f) => `  ${f.name}: ${zodFieldType(f)},`)
    .join("\n");

  return `import { z } from "zod";
import { RestfulApiModel } from "@web-loom/mvvm-core";

const ${name}Schema = z.object({
  id: z.string(),
${schemaFields}
});

export type ${name}Data = z.infer<typeof ${name}Schema>;
export const ${name}ListSchema = z.array(${name}Schema);
export type ${name}ListData = z.infer<typeof ${name}ListSchema>;

export const ${configName} = {
  baseUrl: "${apiBase}",
  endpoint: "${endpoint}",
  fetcher: (url: string, options?: RequestInit) =>
    fetch(url, options).then((r) => {
      if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
      return r.json();
    }),
  initialData: [] as ${name}ListData,
};

export class ${name}Model extends RestfulApiModel<${name}ListData, typeof ${name}ListSchema> {
  constructor(apiBase: string = "${apiBase}") {
    super({
      ...${configName},
      baseUrl: apiBase,
      schema: ${name}ListSchema,
    });
  }
}
`;
}
