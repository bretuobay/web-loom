import { renderPlanToString, renderSourceToString } from './server.js';
import type {
  Disposable,
  PrecompiledTemplateModule,
  SerializableTemplatePlan,
  Template,
  TemplateOptions,
  SerializableRootTemplate,
} from '../types.js';

class ServerTemplate<TVm extends object> implements Template<TVm> {
  isolated?: boolean;
  createContext?: Template['createContext'];

  constructor(
    private readonly source: string,
    private readonly options: TemplateOptions,
    private readonly plan?: SerializableRootTemplate,
  ) {
    this.isolated = options.isolated;
    this.createContext = options.createContext;
  }

  mount(): Disposable {
    throw new Error('Server templates cannot mount into a browser container; use the browser compile() entrypoint.');
  }

  render(): { node: DocumentFragment; dispose(): void } {
    throw new Error('Server templates do not create DOM fragments; use renderToString().');
  }

  hydrate(): Disposable {
    throw new Error('Server templates cannot hydrate browser DOM; use the browser compile() entrypoint.');
  }

  renderToString(viewModel: TVm): string {
    return this.plan?.compiled === false
      ? renderPlanToString(this.plan, viewModel, this.options)
      : renderSourceToString(this.source, viewModel, this.options);
  }
}

export function compile<TVm extends object = object>(source: string, options: TemplateOptions = {}): Template<TVm> {
  return new ServerTemplate<TVm>(source, options);
}

export function fromPrecompiled<TVm extends object = object>(
  module: PrecompiledTemplateModule,
  options: TemplateOptions = {},
): Template<TVm> {
  const plan: SerializableTemplatePlan = module.plan;
  if (plan.version !== 2 || !plan.root) {
    const message = 'Unsupported or incomplete precompiled template plan; regenerate it with template-core v1.2+.';
    const diagnostic = {
      code: 'PRECOMPILED_PLAN_VERSION',
      severity: 'error' as const,
      message,
      template: options.name,
    };
    options.diagnostics?.report?.(diagnostic);
    options.diagnostics?.error?.(message, diagnostic);
    throw new Error(message);
  }
  return new ServerTemplate<TVm>(
    plan.source,
    {
      ...options,
      name: options.name ?? plan.name,
      sourcePath: options.sourcePath ?? plan.sourcePath,
      sourceMap: options.sourceMap ?? plan.sourceMap,
    },
    plan.root,
  );
}
