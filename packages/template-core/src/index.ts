export { compile, registerPartial, unregisterPartial } from './runtime/renderer.js';
export { createTemplateRegistry } from './runtime/registry.js';
export { createTemplateOutlet } from './runtime/outlet.js';
export { precompile } from './compiler/index.js';
export { TemplateSyntaxError } from './errors.js';
export type {
  Disposable,
  ElementAction,
  Template,
  TemplateDiagnostics,
  TemplateOptions,
  TemplateOutlet,
  TemplateRegistry,
  PrecompileOptions,
  PrecompiledTemplateModule,
  SerializableTemplatePlan,
} from './types.js';
