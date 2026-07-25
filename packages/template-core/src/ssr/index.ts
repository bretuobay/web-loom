import { renderSourceToString } from './server.js';
import type {
  Disposable,
  PrecompiledTemplateModule,
  SerializableTemplatePlan,
  Template,
  TemplateOptions,
} from '../types.js';

class ServerTemplate<TVm extends object> implements Template<TVm> {
  constructor(
    private readonly source: string,
    private readonly options: TemplateOptions,
  ) {}

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
    return renderSourceToString(this.source, viewModel, this.options);
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
  return compile<TVm>(plan.source, { ...options, name: options.name ?? plan.name });
}
