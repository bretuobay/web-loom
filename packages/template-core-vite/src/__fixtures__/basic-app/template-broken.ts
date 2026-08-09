import { compile } from '@web-loom/template-core';

export const brokenTemplate = compile(`<p>{{ count + 1 }}</p>`);
