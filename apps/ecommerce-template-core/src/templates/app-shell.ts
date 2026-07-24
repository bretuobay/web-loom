import { compile } from '@web-loom/template-core';

export const appShellTemplate = compile(`
  <div class="app-shell">
    <div data-template-slot="header"></div>
    <main data-template-slot="route"></main>
    <div data-template-slot="cart"></div>
    <div data-template-slot="palette"></div>
    <div data-template-slot="confirmation"></div>
    <div data-template-slot="toast"></div>
  </div>
`);
