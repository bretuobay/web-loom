import { compile } from '@web-loom/template-core';

export const toastTemplate = compile(`
  <div class="toast-stack" aria-live="polite" aria-atomic="true">
    <div class="toast-item">{{ state.toastMessage$ }}</div>
  </div>
`);
