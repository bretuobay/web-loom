import { dispatch, registerCommand, type CommandContext } from './cli/dispatcher.js';
import { loadConfig } from './core/config.js';
import { buildMetricsCommand } from './commands/build/metrics.js';
import { workspaceInfoCommand } from './commands/workspace/info.js';
import { workspaceListCommand } from './commands/workspace/list.js';

// Register all available commands
registerCommand('build', 'metrics', buildMetricsCommand);
registerCommand('workspace', 'info', workspaceInfoCommand);
registerCommand('workspace', 'list', workspaceListCommand);

export async function main(args: string[]): Promise<void> {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);

  const context: CommandContext = {
    cwd,
    config,
  };

  const exitCode = await dispatch(args, context);
  process.exit(exitCode);
}

// Export types and utilities for external use
export type { Command, CommandContext, Config } from './cli/dispatcher.js';
export type { WorkspaceProject, WorkspaceConfig } from './core/workspace.js';
export type { ProjectArtifacts, ArtifactInfo } from './core/buildArtifacts.js';
export { loadWorkspaceConfig, findProject, getProjectsByType } from './core/workspace.js';
export { getProjectArtifacts, formatBytes } from './core/buildArtifacts.js';
export { loadConfig, createConfigFile } from './core/config.js';
