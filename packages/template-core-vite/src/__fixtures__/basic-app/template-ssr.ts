import { compile } from '@web-loom/template-core/ssr';

export const ssrTemplate = compile(`<p>{{ msg }}</p>`);
