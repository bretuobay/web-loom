export interface CommandTemplateParams {
  name: string;
  paramType?: string;
  resultType?: string;
  canExecuteLogic?: string;
  description?: string;
}

export interface CompositeCommandTemplateParams {
  name: string;
  childCommands: string[];
  mode?: "parallel" | "sequential";
}

export function commandTemplate(p: CommandTemplateParams): string {
  const {
    name,
    paramType = "void",
    resultType = "void",
    canExecuteLogic,
    description,
  } = p;

  const paramArg = paramType === "void" ? "" : `param: ${paramType}`;
  const canExecuteArg = canExecuteLogic
    ? `,\n  // canExecute: returns Observable<boolean> or boolean\n  ${canExecuteLogic}`
    : "";

  const descComment = description ? `// ${description}\n` : "";

  return `import { Command } from "@web-loom/mvvm-core";

${descComment}export const ${name} = new Command<${paramType}, ${resultType}>(
  async (${paramArg}): Promise<${resultType}> => {
    // TODO: implement
  }${canExecuteArg}
);

// Usage:
// ${name}.execute(${paramType === "void" ? "" : "param"});
// ${name}.isExecuting$  // Observable<boolean> — use for loading state
// ${name}.canExecute$   // Observable<boolean> — use to enable/disable UI
// ${name}.executeError$ // Observable<unknown> — last execution error
`;
}

export function compositeCommandTemplate(p: CompositeCommandTemplateParams): string {
  const { name, childCommands, mode = "parallel" } = p;
  const registrations = childCommands
    .map((cmd) => `${name}.register(${cmd});`)
    .join("\n");

  return `import { CompositeCommand } from "@web-loom/mvvm-core";

export const ${name} = new CompositeCommand({
  executionMode: "${mode}",
  monitorCommandActivity: true,
});

// Register child commands
${registrations}

// Usage:
// ${name}.execute();
// ${name}.isExecuting$  // true while any child runs
// ${name}.canExecute$   // true when ALL children can execute
`;
}
