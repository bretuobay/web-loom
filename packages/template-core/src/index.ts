export { compile, fromPrecompiled, registerPartial, unregisterPartial } from './runtime/renderer.js';
export { createTemplateRegistry } from './runtime/registry.js';
export { createTemplateOutlet } from './runtime/outlet.js';
export { precompile } from './compiler/index.js';
export { TemplateSyntaxError } from './errors.js';
export {
  declareContext,
  typedCompile,
  typedFromPrecompiled,
} from './typing.js';
export type {
  HelperMap,
  PartialContextSchema,
  PartialContexts,
  TemplateContextFactory,
  TypedPartialsMap,
  TypedTemplateCompileOptions,
} from './typing.js';
export type {
  Disposable,
  ElementAction,
  Template,
  TemplateDiagnostics,
  TemplateDiagnostic,
  SourceLocation,
  TemplateOptions,
  TemplateOutlet,
  TemplateRegistry,
  PrecompileOptions,
  PrecompiledTemplateModule,
  SerializableTemplatePlan,
  SerializableRootTemplate,
  SerializableNode,
} from './types.js';
