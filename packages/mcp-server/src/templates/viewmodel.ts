export interface CustomCommandDef {
  name: string;
  paramType?: string;
  resultType?: string;
  description?: string;
}

export interface ViewModelTemplateParams {
  name: string;
  modelClass: string;
  schemaModule?: string;
  customCommands?: CustomCommandDef[];
}

function customCommandBlock(cmd: CustomCommandDef): string {
  const pType = cmd.paramType ?? "void";
  const rType = cmd.resultType ?? "void";
  const executeFn =
    pType === "void"
      ? `async () => {\n    // TODO: implement ${cmd.name}\n  }`
      : `async (_param: ${pType}) => {\n    // TODO: implement ${cmd.name}\n  }`;
  return `
  public readonly ${cmd.name} = this.registerCommand(
    new Command<${pType}, ${rType}>(${executeFn})
  );`;
}

export function viewModelTemplate(p: ViewModelTemplateParams): string {
  const { name, modelClass, schemaModule, customCommands = [] } = p;
  const schemaMod = schemaModule ?? `./${name}Schema.js`;
  const modelMod = `./${modelClass}.js`;
  const hasCustomCommands = customCommands.length > 0;
  const commandImport = hasCustomCommands
    ? `import { RestfulApiViewModel, Command } from "@web-loom/mvvm-core";`
    : `import { RestfulApiViewModel } from "@web-loom/mvvm-core";`;

  const commandBlocks = customCommands.map(customCommandBlock).join("\n");

  return `${commandImport}
import type { ${name}ListData, ${name}ListSchema } from "${schemaMod}";
import { ${modelClass} } from "${modelMod}";

export class ${name}ViewModel extends RestfulApiViewModel<${name}ListData, typeof ${name}ListSchema> {${commandBlocks}

  constructor(model: ${modelClass}) {
    super(model);
  }

  public override dispose(): void {
    super.dispose();
  }
}
`;
}
