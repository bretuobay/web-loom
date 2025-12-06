export interface Command {
  name: string;
  description: string;
  run(args: string[], context: CommandContext): Promise<number>;
}

export interface CommandContext {
  cwd: string;
  config?: Config;
}

export interface Config {
  artifactGlobs?: Record<string, string>;
  projectTypes?: Record<string, string>;
}

interface ParsedArgs {
  domain?: string;
  action?: string;
  flags: Record<string, string | boolean>;
  remaining: string[];
}

const commands = new Map<string, Command>();

export function registerCommand(domain: string, action: string, command: Command) {
  const key = `${domain}:${action}`;
  commands.set(key, command);
}

export function parseArgs(args: string[]): ParsedArgs {
  const flags: Record<string, string | boolean> = {};
  const remaining: string[] = [];
  let domain: string | undefined;
  let action: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg?.startsWith('--')) {
      const flagName = arg.slice(2);
      const nextArg = args[i + 1];

      if (nextArg && !nextArg.startsWith('-')) {
        flags[flagName] = nextArg;
        i++; // Skip next arg as it's the flag value
      } else {
        flags[flagName] = true;
      }
    } else if (!domain) {
      domain = arg;
    } else if (!action) {
      action = arg;
    } else if (arg) {
      remaining.push(arg);
    }
  }

  return { domain, action, flags, remaining };
}

function showHelp() {
  console.log(`
@web-loom/turbo-analyse - CLI tool for analyzing Turborepo monorepos

Usage: turbo-analyse <domain> <action> [options]
       wl <domain> <action> [options]

Domains:
  build      Build-related analysis
  workspace  Workspace inspection

Commands:
  build metrics       Show build artifact sizes
  workspace info      Display workspace summary
  workspace list      List all workspace projects

Global options:
  --help              Show this help
  --json              Output as JSON
  --version           Show version

Examples:
  turbo-analyse build metrics
  wl workspace info
  turbo-analyse build metrics --project my-app --json
  wl workspace list --with-paths
`);
}

export async function dispatch(args: string[], context: CommandContext): Promise<number> {
  const parsed = parseArgs(args);

  if (parsed.flags.help || (!parsed.domain && !parsed.action)) {
    showHelp();
    return 0;
  }

  if (parsed.flags.version) {
    console.log('0.5.2');
    return 0;
  }

  if (!parsed.domain || !parsed.action) {
    console.error('Error: Both domain and action are required');
    showHelp();
    return 1;
  }

  const commandKey = `${parsed.domain}:${parsed.action}`;
  const command = commands.get(commandKey);

  if (!command) {
    console.error(`Error: Unknown command '${parsed.domain} ${parsed.action}'`);
    showHelp();
    return 1;
  }

  try {
    return await command.run(args, context);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return 1;
  }
}
