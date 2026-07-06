export interface FieldDef {
  name: string;
  type: "string" | "number" | "boolean" | "string[]" | "number[]";
  optional?: boolean;
}

export const MODEL_STYLES = ["restful-class", "restful-config", "base-state", "query-cache"] as const;

export type ModelStyle = (typeof MODEL_STYLES)[number];

export interface ModelTemplateParams {
  name: string;
  endpoint: string;
  fields: FieldDef[];
  apiBase?: string;
  style?: ModelStyle;
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

function schemaBlock(name: string, fields: FieldDef[]): string {
  const schemaFields = fields
    .map((f) => `  ${f.name}: ${zodFieldType(f)},`)
    .join("\n");

  return `const ${name}Schema = z.object({
  id: z.string(),
${schemaFields}
});

export type ${name}Data = z.infer<typeof ${name}Schema>;
export const ${name}ListSchema = z.array(${name}Schema);
export type ${name}ListData = z.infer<typeof ${name}ListSchema>;`;
}

function configBlock(name: string, endpoint: string, apiBase: string): string {
  const configName = `${lowerFirst(name)}Config`;

  return `export const ${configName} = {
  baseUrl: "${apiBase}",
  endpoint: "${endpoint}",
  fetcher: (url: string, options?: RequestInit) =>
    fetch(url, options).then((r) => {
      if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
      return r.json();
    }),
  initialData: [] as ${name}ListData,
};`;
}

function restfulClassModelTemplate(p: ModelTemplateParams): string {
  const { name, endpoint, fields, apiBase = "http://localhost:3000" } = p;
  const configName = `${lowerFirst(name)}Config`;

  return `import { z } from "zod";
import { RestfulApiModel } from "@web-loom/mvvm-core";

${schemaBlock(name, fields)}

${configBlock(name, endpoint, apiBase)}

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

function restfulConfigModelTemplate(p: ModelTemplateParams): string {
  const { name, endpoint, fields, apiBase = "http://localhost:3000" } = p;

  return `import { z } from "zod";

${schemaBlock(name, fields)}

${configBlock(name, endpoint, apiBase)}
`;
}

function baseStateModelTemplate(p: ModelTemplateParams): string {
  const { name, endpoint, fields, apiBase = "http://localhost:3000" } = p;
  const initialName = `${lowerFirst(name)}InitialData`;

  return `import { z } from "zod";
import { BaseModel } from "@web-loom/mvvm-core";

${schemaBlock(name, fields)}

export const ${initialName}: ${name}ListData = [];

export class ${name}Model extends BaseModel<${name}ListData, typeof ${name}ListSchema> {
  constructor(initialData: ${name}ListData = ${initialName}) {
    super({ initialData, schema: ${name}ListSchema });
  }

  public async fetch(): Promise<void> {
    this.setLoading(true);
    this.clearError();

    try {
      const response = await fetch("${apiBase}${endpoint}");
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}\`);
      }

      const data = ${name}ListSchema.parse(await response.json());
      this.setData(data);
    } catch (error) {
      this.setError(error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  public replaceAll(items: ${name}ListData): void {
    this.setData(${name}ListSchema.parse(items));
  }

  public clear(): void {
    this.setData(${initialName});
  }
}
`;
}

function queryCacheModelTemplate(p: ModelTemplateParams): string {
  const { name, endpoint, fields, apiBase = "http://localhost:3000" } = p;
  const endpointKey = `${lowerFirst(name)}:list`;

  return `import { z } from "zod";
import { BaseModel } from "@web-loom/mvvm-core";
import { QueryCore, type EndpointState } from "@web-loom/query-core";

${schemaBlock(name, fields)}

export class ${name}Model extends BaseModel<${name}ListData, typeof ${name}ListSchema> {
  private readonly query = new QueryCore({
    cacheProvider: "inMemory",
    defaultRefetchAfter: 60_000,
  });
  private queryUnsubscribe: (() => void) | null = null;
  private initialized = false;

  constructor(private readonly apiBase: string = "${apiBase}") {
    super({ initialData: [], schema: ${name}ListSchema });
  }

  public async fetch(forceRefetch = false): Promise<void> {
    await this.ensureInitialized();
    await this.query.refetch("${endpointKey}", forceRefetch);
  }

  public async refresh(): Promise<void> {
    await this.ensureInitialized();
    await this.query.invalidate("${endpointKey}");
    await this.query.refetch("${endpointKey}", true);
  }

  public override dispose(): void {
    if (this.queryUnsubscribe) {
      this.queryUnsubscribe();
      this.queryUnsubscribe = null;
    }

    super.dispose();
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.query.defineEndpoint("${endpointKey}", async () => {
      const response = await fetch(\`\${this.apiBase}${endpoint}\`);
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}\`);
      }

      return ${name}ListSchema.parse(await response.json());
    });

    this.queryUnsubscribe = this.query.subscribe<${name}ListData>("${endpointKey}", (state) => {
      this.syncFromQueryState(state);
    });

    this.initialized = true;
  }

  private syncFromQueryState(state: EndpointState<${name}ListData>): void {
    this.setLoading(state.isLoading);

    if (state.error) {
      this.setError(state.error);
    } else {
      this.clearError();
    }

    if (state.data) {
      this.setData(state.data);
    }
  }
}
`;
}

export function modelTemplate(p: ModelTemplateParams): string {
  switch (p.style ?? "restful-class") {
    case "restful-config":
      return restfulConfigModelTemplate(p);
    case "base-state":
      return baseStateModelTemplate(p);
    case "query-cache":
      return queryCacheModelTemplate(p);
    case "restful-class":
      return restfulClassModelTemplate(p);
  }
}
