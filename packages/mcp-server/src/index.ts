import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { registerDocsResources } from './resources/docs.js';
import { registerArchitectureResource } from './resources/architecture.js';

import { registerScaffoldModelTool } from './tools/scaffold-model.js';
import { registerScaffoldViewModelTool } from './tools/scaffold-viewmodel.js';
import { registerScaffoldFeatureTool } from './tools/scaffold-feature.js';
import { registerScaffoldCommandTool } from './tools/scaffold-command.js';
import { registerScaffoldPluginTool } from './tools/scaffold-plugin.js';
import { registerScaffoldFormTool } from './tools/scaffold-form.js';
import { registerExplainPatternTool } from './tools/explain-pattern.js';
import { registerListPackagesTool } from './tools/list-packages.js';
import { registerSelectPackageTool } from './tools/select-package.js';

import { registerCreateMvvmFeaturePrompt } from './prompts/create-mvvm-feature.js';
import { registerDebugViewModelPrompt } from './prompts/debug-viewmodel.js';
import { registerMigrateToWebLoomPrompt } from './prompts/migrate-to-web-loom.js';

const server = new McpServer({
  name: '@web-loom/mcp-server',
  version: '0.1.0',
});

// Resources
registerDocsResources(server);
registerArchitectureResource(server);

// Scaffolding tools
registerScaffoldModelTool(server);
registerScaffoldViewModelTool(server);
registerScaffoldFeatureTool(server);
registerScaffoldCommandTool(server);
registerScaffoldPluginTool(server);
registerScaffoldFormTool(server);

// Knowledge tools
registerExplainPatternTool(server);
registerListPackagesTool(server);
registerSelectPackageTool(server);

// Guided prompts
registerCreateMvvmFeaturePrompt(server);
registerDebugViewModelPrompt(server);
registerMigrateToWebLoomPrompt(server);

const transport = new StdioServerTransport();
await server.connect(transport);
