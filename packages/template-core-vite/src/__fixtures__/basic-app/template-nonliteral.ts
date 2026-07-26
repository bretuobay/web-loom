import { compile } from '@web-loom/template-core/ssr';
import { nonliteralTemplateSource } from './nonliteral-source.js';

export const nonliteralTemplate = compile(nonliteralTemplateSource);
