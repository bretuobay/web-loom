import { declareContext } from '@web-loom/template-core';
import type { TemplateAppBindings } from '../app/bindings';

const partial = declareContext<TemplateAppBindings>();

export const toastTemplate = partial.compile(`<div class="toast-stack" aria-live="polite" aria-atomic="true">
  <div class="toast-item">
    {{ state.toastMessage$ }}
  </div>
</div>
`);
