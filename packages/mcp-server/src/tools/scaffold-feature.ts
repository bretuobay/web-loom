import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MODEL_STYLES, modelTemplate, type FieldDef, type ModelStyle } from '../templates/model.js';
import { VIEW_MODEL_STYLES, viewModelTemplate, type ViewModelStyle } from '../templates/viewmodel.js';
import { adapterTemplate, type Framework } from '../templates/adapter.js';

const FieldSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'string[]', 'number[]']),
  optional: z.boolean().optional(),
});

function defaultModelStyleFor(viewModelStyle: ViewModelStyle): ModelStyle {
  if (viewModelStyle === 'reactive-factory') {
    return 'restful-config';
  }

  if (viewModelStyle === 'base-commands') {
    return 'base-state';
  }

  if (viewModelStyle === 'active-signals-list') {
    return 'query-cache';
  }

  return 'restful-class';
}

function packageInstallHint(modelStyle: ModelStyle, viewModelStyle: ViewModelStyle): string {
  const packages = new Set(['@web-loom/mvvm-core', '@web-loom/signals-core', 'zod']);

  if (modelStyle === 'query-cache') {
    packages.add('@web-loom/query-core');
  }

  if (viewModelStyle === 'active-signals-list') {
    packages.add('@web-loom/mvvm-patterns');
    packages.add('@web-loom/signals-core');
  }

  return `npm install ${Array.from(packages).join(' ')}`;
}

export function registerScaffoldFeatureTool(server: McpServer): void {
  server.registerTool(
    'scaffold_restful_feature',
    {
      description:
        'Generate a complete MVVM feature: Zod schema + model + ViewModel + framework adapter. Supports compatible model/viewmodel style pairs.',
      inputSchema: {
        name: z.string().describe("Feature/entity name in PascalCase (e.g. 'Product', 'BlogPost')"),
        endpoint: z.string().describe("REST API endpoint (e.g. '/products')"),
        fields: z.array(FieldSchema).describe('Entity fields (id is always included automatically)'),
        framework: z
          .enum(['react', 'vue', 'vanilla', 'angular', 'lit'])
          .describe('Target UI framework for the adapter layer'),
        apiBase: z.string().optional().describe("Base API URL (default: 'http://localhost:3000')"),
        viewModelStyle: z
          .enum(VIEW_MODEL_STYLES)
          .optional()
          .describe("ViewModel template style (default: 'restful-class')"),
        modelStyle: z
          .enum(MODEL_STYLES)
          .optional()
          .describe('Model template style. Defaults to a compatible style for the selected viewModelStyle.'),
      },
    },
    async ({ name, endpoint, fields, framework, apiBase, viewModelStyle, modelStyle }) => {
      const typedFields = fields as FieldDef[];
      const selectedViewModelStyle = (viewModelStyle ?? 'restful-class') as ViewModelStyle;
      const selectedModelStyle = (modelStyle ?? defaultModelStyleFor(selectedViewModelStyle)) as ModelStyle;
      const modelCode = modelTemplate({
        name,
        endpoint,
        fields: typedFields,
        apiBase,
        style: selectedModelStyle,
      });
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
        framework === 'react'
          ? `use${name}.ts`
          : framework === 'vue'
            ? `use${name}.ts`
            : framework === 'angular'
              ? `${name}.service.ts`
              : framework === 'lit'
                ? `${name}ViewElement.ts`
                : `${name}Controller.ts`;

      const files: Record<string, string> = {
        [`${name}Model.ts`]: modelCode,
        [`${name}ViewModel.ts`]: vmCode,
        [adapterFileName]: adapterCode,
      };

      const sections = Object.entries(files)
        .map(([file, code]) => `### \`${file}\`\n\`\`\`typescript\n${code}\`\`\``)
        .join('\n\n');

      return {
        content: [
          {
            type: 'text' as const,
            text: [
              `# ${name} Feature — ${framework} adapter\n`,
              `Model style: \`${selectedModelStyle}\` · ViewModel style: \`${selectedViewModelStyle}\`\n`,
              'Create these files in your feature directory:\n',
              sections,
              '\n## Setup',
              `1. Install: \`${packageInstallHint(selectedModelStyle, selectedViewModelStyle)}\``,
              `2. Import \`${name}Model\` and the generated \`${name}ViewModel\` export from their files`,
              framework === 'react'
                ? `3. Use the \`use${name}()\` hook in your component`
                : framework === 'vue'
                  ? `3. Call \`use${name}()\` inside your \`<script setup>\``
                  : framework === 'angular'
                    ? `3. Provide \`${name}Service\` in your module providers`
                    : framework === 'lit'
                      ? `3. Import \`${name}ViewElement.ts\` and render \`<${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}-view>\``
                      : `3. Call \`create${name}Controller()\` and hold the reference`,
            ].join('\n'),
          },
        ],
      };
    },
  );
}
