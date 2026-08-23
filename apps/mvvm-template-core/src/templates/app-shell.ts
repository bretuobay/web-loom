import { declareContext } from '@web-loom/template-core';
import type { AppContext } from '../app/context';
import { appFrame } from './app-frame';
import { footer } from './footer';
import { header } from './header';

const chrome = declareContext<AppContext>();

export const appShell = chrome.compile(
  `{{#> app-frame links=links}}
  {{#slot header}}
    {{> header}}
  {{/slot}}
  {{#slot footer}}
    {{> footer}}
  {{/slot}}
{{/app-frame}}
`,
  {
    partials: {
      'app-frame': appFrame,
      header,
      footer,
    },
  },
);
