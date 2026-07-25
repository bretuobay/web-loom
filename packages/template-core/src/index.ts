export { compile, registerPartial, unregisterPartial } from './runtime/renderer.js';
export { createTemplateRegistry } from './runtime/registry.js';
export { createTemplateOutlet } from './runtime/outlet.js';
export { TemplateSyntaxError } from './errors.js';
export type {
  Disposable,
  ElementAction,
  Template,
  TemplateDiagnostics,
  TemplateOptions,
  TemplateOutlet,
  TemplateRegistry,
} from './types.js';
