import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { commandTemplate, compositeCommandTemplate } from '../templates/command.js';

export function registerScaffoldCommandTool(server: McpServer): void {
  server.registerTool(
    'scaffold_command',
    {
      description:
        'Generate a standalone Command<TParam, TResult> or CompositeCommand. Commands encapsulate async actions with built-in isExecuting$, canExecute$, and executeError$ signals.',
      inputSchema: {
        name: z.string().describe("Command name (camelCase, e.g. 'exportToCsvCommand')"),
        paramType: z.string().optional().describe("TypeScript type for the execute parameter (default: 'void')"),
        resultType: z.string().optional().describe("TypeScript return type (default: 'void')"),
        canExecuteLogic: z
          .string()
          .optional()
          .describe(
            "Optional canExecute expression — a ReadonlySignal<boolean> or function returning boolean. Example: '() => !this.isLoading$.get()'",
          ),
        description: z.string().optional().describe("Short description of the command's purpose"),
        composite: z
          .object({
            childCommands: z.array(z.string()).describe('Names of child commands to register'),
            mode: z.enum(['parallel', 'sequential']).optional(),
          })
          .optional()
          .describe('If set, generates a CompositeCommand instead'),
      },
    },
    async ({ name, paramType, resultType, canExecuteLogic, description, composite }) => {
      const code = composite
        ? compositeCommandTemplate({ name, childCommands: composite.childCommands, mode: composite.mode })
        : commandTemplate({ name, paramType, resultType, canExecuteLogic, description });

      return {
        content: [
          {
            type: 'text' as const,
            text: [`Generated \`${name}\`:\n`, '```typescript', code, '```'].join('\n'),
          },
        ],
      };
    },
  );
}
