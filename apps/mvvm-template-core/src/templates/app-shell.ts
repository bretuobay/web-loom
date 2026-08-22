import { declareContext } from '@web-loom/template-core';
import type { AppContext } from '../app/context';
import { appFrame } from './app-frame';
import { footerTemplate } from './footer';
import { headerTemplate } from './header';

const chrome = declareContext<AppContext>();

export const appShellTemplate = chrome.compile(
  `{{#> app-frame links=links}}
  {{#slot header}}
    {{> header items=navigationItems$}}
  {{/slot}}
  {{#slot footer}}
    {{> footer year=currentYear}}
  {{/slot}}
{{/app-frame}}
`,
  {
    partials: {
      'app-frame': appFrame,
      header: headerTemplate,
      footer: footerTemplate,
    },
  },
);
