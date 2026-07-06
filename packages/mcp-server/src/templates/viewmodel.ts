export interface CustomCommandDef {
  name: string;
  paramType?: string;
  resultType?: string;
  description?: string;
}

export const VIEW_MODEL_STYLES = [
  "restful-class",
  "reactive-factory",
  "base-commands",
  "active-signals-list",
] as const;

export type ViewModelStyle = (typeof VIEW_MODEL_STYLES)[number];

export interface ViewModelTemplateParams {
  name: string;
  modelClass: string;
  schemaModule?: string;
  customCommands?: CustomCommandDef[];
  style?: ViewModelStyle;
  dataType?: string;
  itemType?: string;
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function isNamedType(value: string): boolean {
  return /^[A-Za-z_$][\w$]*$/.test(value);
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

function schemaModuleFor(p: ViewModelTemplateParams): string {
  return p.schemaModule ?? `./${p.modelClass}.js`;
}

function modelModuleFor(modelClass: string): string {
  const modelMod = `./${modelClass}.js`;
  return modelMod;
}

function restfulClassTemplate(p: ViewModelTemplateParams): string {
  const { name, modelClass, customCommands = [], dataType = `${name}ListData` } = p;
  const schemaMod = schemaModuleFor(p);
  const modelMod = modelModuleFor(modelClass);
  const hasCustomCommands = customCommands.length > 0;
  const commandImport = hasCustomCommands
    ? `import { RestfulApiViewModel, Command } from "@web-loom/mvvm-core";`
    : `import { RestfulApiViewModel } from "@web-loom/mvvm-core";`;

  const commandBlocks = customCommands.map(customCommandBlock).join("\n");

  return `${commandImport}
import type { ${dataType}, ${name}ListSchema } from "${schemaMod}";
import { ${modelClass} } from "${modelMod}";

export class ${name}ViewModel extends RestfulApiViewModel<${dataType}, typeof ${name}ListSchema> {${commandBlocks}

  constructor(model: ${modelClass}) {
    super(model);
  }

  public override dispose(): void {
    super.dispose();
  }
}
`;
}

function reactiveFactoryTemplate(p: ViewModelTemplateParams): string {
  const { name, dataType = `${name}ListData` } = p;
  const schemaMod = schemaModuleFor(p);
  const configName = `${lowerFirst(name)}Config`;
  const instanceName = `${lowerFirst(name)}ViewModel`;
  const factoryName = `create${name}ViewModel`;

  return `import { createReactiveViewModel, type ViewModelFactoryConfig } from "@web-loom/mvvm-core";
import { ${configName}, ${name}ListSchema, type ${dataType} } from "${schemaMod}";

type ${name}ViewModelConfig = ViewModelFactoryConfig<${dataType}, typeof ${name}ListSchema>;

const config: ${name}ViewModelConfig = {
  modelConfig: ${configName},
  schema: ${name}ListSchema,
};

export function ${factoryName}() {
  return createReactiveViewModel(config);
}

export const ${instanceName} = ${factoryName}();

export type { ${dataType} };
`;
}

function baseCommandsTemplate(p: ViewModelTemplateParams): string {
  const { name, modelClass, customCommands = [], dataType = `${name}ListData` } = p;
  const schemaMod = schemaModuleFor(p);
  const modelMod = modelModuleFor(modelClass);
  const commands =
    customCommands.length > 0
      ? customCommands.map(customCommandBlock).join("\n")
      : `
  public readonly refreshCommand = this.registerCommand(
    new Command<void, void>(async () => {
      // TODO: call the model method that refreshes ${name} data
    })
  );`;

  return `import { BaseViewModel, Command } from "@web-loom/mvvm-core";
import type { ${dataType} } from "${schemaMod}";
import { ${modelClass} } from "${modelMod}";

export class ${name}ViewModel extends BaseViewModel<${modelClass}> {${commands}

  constructor(model: ${modelClass}) {
    super(model);
  }

  public override dispose(): void {
    super.dispose();
  }
}

export type { ${dataType} };
`;
}

function activeSignalsListTemplate(p: ViewModelTemplateParams): string {
  const { name, modelClass, dataType = `${name}ListData`, itemType = `${name}Data` } = p;
  const schemaMod = schemaModuleFor(p);
  const modelMod = modelModuleFor(modelClass);
  const dataTypeName = isNamedType(dataType) ? dataType : `${name}ListData`;
  const dataTypeImport = isNamedType(dataType) ? `${dataType}, ` : "";
  const dataTypeAlias = isNamedType(dataType) ? "" : `type ${dataTypeName} = ${dataType};\n`;

  return `import { Command } from "@web-loom/mvvm-core";
import { ActiveAwareViewModel } from "@web-loom/mvvm-patterns";
import { computed, signal, type ReadonlySignal } from "@web-loom/signals-core";
import type { ${dataTypeImport}${itemType} } from "${schemaMod}";
import { ${modelClass} } from "${modelMod}";

${dataTypeAlias}\
export class ${name}ViewModel extends ActiveAwareViewModel<${modelClass}> {
  private readonly itemsState = signal<${itemType}[]>([]);
  private readonly searchState = signal("");
  private readonly selectedState = signal<${itemType} | null>(null);

  public readonly items: ReadonlySignal<${itemType}[]> = this.itemsState.asReadonly();
  public readonly searchQuery: ReadonlySignal<string> = this.searchState.asReadonly();
  public readonly selectedItem: ReadonlySignal<${itemType} | null> = this.selectedState.asReadonly();
  public readonly totalItems = computed(() => this.itemsState.get().length);

  public readonly filteredItems = computed(() => {
    const query = this.searchState.get().trim().toLowerCase();
    const all = this.itemsState.get();

    if (!query) {
      return all;
    }

    return all.filter((item) =>
      Object.values(item as Record<string, unknown>).some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
  });

  public readonly loadCommand = this.registerCommand(
    new Command<void, void>(async () => {
      await this.model.fetch();
    })
  );

  public readonly refreshCommand = this.registerCommand(
    new Command<void, void>(async () => {
      await this.model.fetch();
    })
  );

  constructor(model: ${modelClass}) {
    super(model);

    this.addSubscription(
      this.model.data$.subscribe((items: ${dataTypeName} | null) => {
        const list = Array.isArray(items) ? items : [];
        this.itemsState.set(list);
      })
    );
  }

  public setSearchQuery(value: string): void {
    this.searchState.set(value);
  }

  public selectItem(item: ${itemType}): void {
    this.selectedState.set(item);
  }

  public clearSelection(): void {
    this.selectedState.set(null);
  }

  protected override onIsActiveChanged(isActive: boolean, _wasActive: boolean): void {
    if (isActive) {
      void this.refreshCommand.execute();
    }
  }

  public override dispose(): void {
    super.dispose();
  }
}

export type { ${dataTypeName}, ${itemType} };
`;
}

export function viewModelTemplate(p: ViewModelTemplateParams): string {
  switch (p.style ?? "restful-class") {
    case "reactive-factory":
      return reactiveFactoryTemplate(p);
    case "base-commands":
      return baseCommandsTemplate(p);
    case "active-signals-list":
      return activeSignalsListTemplate(p);
    case "restful-class":
      return restfulClassTemplate(p);
  }
}
