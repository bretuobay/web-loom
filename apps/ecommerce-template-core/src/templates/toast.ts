import { declareContext } from '@web-loom/template-core';
import type { AppContext } from '../app/context';

const partial = declareContext<AppContext>();

export const toastTemplate = partial.compile(`<div class="toast-stack" aria-live="polite" aria-atomic="true">
  <div class="toast-item">
    {{ state.toastMessage$ }}
  </div>
</div>
`);
