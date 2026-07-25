import { preprocess } from './preprocess.js';
import type { PrecompileOptions, PrecompiledTemplateModule, SerializableTemplatePlan } from '../types.js';

export function precompile(source: string, options: PrecompileOptions = {}): PrecompiledTemplateModule {
  const plan: SerializableTemplatePlan = {
    version: 1,
    source,
    preprocessed: preprocess(source),
    name: options.name,
    sourcePath: options.sourcePath,
  };
  return { plan };
}
