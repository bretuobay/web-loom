import type { Command, CommandContext } from '../../cli/dispatcher.js';
import { loadWorkspaceConfig, getProjectsByType } from '../../core/workspace.js';
import { outputResult } from '../../core/output.js';
import { parseArgs } from '../../cli/dispatcher.js';

export const workspaceInfoCommand: Command = {
  name: 'workspace info',
  description: 'Display workspace summary',

  async run(args: string[], context: CommandContext): Promise<number> {
    try {
      const parsed = parseArgs(args);
      const workspaceConfig = await loadWorkspaceConfig(context.cwd);

      const apps = getProjectsByType(workspaceConfig, 'app');
      const packages = getProjectsByType(workspaceConfig, 'package');
      const totalProjects = workspaceConfig.projects.length;

      if (parsed.flags.json) {
        const jsonData = {
          totalProjects,
          apps: apps.length,
          packages: packages.length,
          workspaceName: workspaceConfig.rootPackageJson.name || 'Unknown',
          hasTurboConfig: Boolean(workspaceConfig.turboConfig),
          projects: workspaceConfig.projects.map((p) => ({
            name: p.name,
            type: p.type,
            path: p.path,
          })),
        };

        outputResult(jsonData, true);
      } else {
        console.log(`\nWorkspace: ${workspaceConfig.rootPackageJson.name || 'Unknown'}`);
        console.log(`Total projects: ${totalProjects}`);
        console.log(`Apps: ${apps.length}`);
        console.log(`Packages: ${packages.length}`);
        console.log(`Turbo config: ${workspaceConfig.turboConfig ? 'Yes' : 'No'}`);

        if (totalProjects > 0) {
          console.log(`\nProjects by type:`);
          if (apps.length > 0) {
            console.log(`\nApps (${apps.length}):`);
            apps.forEach((app) => console.log(`  • ${app.name}`));
          }

          if (packages.length > 0) {
            console.log(`\nPackages (${packages.length}):`);
            packages.forEach((pkg) => console.log(`  • ${pkg.name}`));
          }
        }
      }

      return 0;
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return 1;
    }
  },
};
