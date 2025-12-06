import type { Command, CommandContext } from '../../cli/dispatcher.js';
import { loadWorkspaceConfig } from '../../core/workspace.js';
import { outputResult, createSimpleTable } from '../../core/output.js';
import { parseArgs } from '../../cli/dispatcher.js';
import { relative } from 'node:path';

export const workspaceListCommand: Command = {
  name: 'workspace list',
  description: 'List all workspace projects with details',

  async run(args: string[], context: CommandContext): Promise<number> {
    try {
      const parsed = parseArgs(args);
      const workspaceConfig = await loadWorkspaceConfig(context.cwd);

      if (workspaceConfig.projects.length === 0) {
        console.log('No projects found in workspace');
        return 0;
      }

      if (parsed.flags.json) {
        const jsonData = workspaceConfig.projects.map((project) => ({
          name: project.name,
          type: project.type,
          path: parsed.flags['with-paths'] ? project.path : relative(context.cwd, project.path),
          hasBuild: project.hasScript('build'),
          hasTest: project.hasScript('test'),
          hasLint: project.hasScript('lint'),
          scripts: parsed.flags['with-scripts'] ? Object.keys(project.packageJson.scripts || {}) : undefined,
        }));

        outputResult(jsonData, true);
      } else {
        // Create table headers based on flags
        const headers = ['Name', 'Type'];

        if (parsed.flags['with-paths']) {
          headers.push('Path');
        }

        headers.push('Build', 'Test');

        if (parsed.flags['with-scripts']) {
          headers.push('Scripts');
        }

        // Create table rows
        const rows = workspaceConfig.projects.map((project) => {
          const row = [project.name, project.type];

          if (parsed.flags['with-paths']) {
            row.push(relative(context.cwd, project.path));
          }

          row.push(project.hasScript('build') ? 'Yes' : 'No', project.hasScript('test') ? 'Yes' : 'No');

          if (parsed.flags['with-scripts']) {
            const scripts = Object.keys(project.packageJson.scripts || {});
            row.push(scripts.length > 0 ? scripts.join(', ') : 'None');
          }

          return row;
        });

        const { columns, rows: tableRows } = createSimpleTable(headers, rows);

        console.log(`\nWorkspace Projects (${workspaceConfig.projects.length} total)\n`);
        console.log(outputResult({ columns, rows: tableRows, table: true }, false));
      }

      return 0;
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return 1;
    }
  },
};
