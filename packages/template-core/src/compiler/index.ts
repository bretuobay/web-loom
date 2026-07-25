import { preprocess } from './preprocess.js';
import { parseTemplate } from './parser.js';
import { createSourceMap, serializeRootTemplate } from './plan.js';
import type { PrecompileOptions, PrecompiledTemplateModule, SerializableTemplatePlan } from '../types.js';

export function precompile(source: string, options: PrecompileOptions = {}): PrecompiledTemplateModule {
  const root = typeof document === 'undefined' ? undefined : parseTemplate(source);
  const plan: SerializableTemplatePlan = {
    version: 2,
    source,
    preprocessed: preprocess(source),
    name: options.name,
    sourcePath: options.sourcePath,
    ...(root ? { sourceMap: createSourceMap(root, source) } : {}),
    ...(root ? { root: serializeRootTemplate(root) } : {}),
  };
  return { plan };
}
