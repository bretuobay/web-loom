import { declareContext } from '@web-loom/template-core';
import { defineComponent } from '@web-loom/view';

export interface ToastProps {
  message: string;
}

const card = declareContext<ToastProps>();

export const toast = defineComponent<ToastProps>({
  name: 'toast',
  props: ['message'],
  template: card.compile(`<div class="toast-stack" aria-live="polite" aria-atomic="true">
  <div class="toast-item">
    {{ message }}
  </div>
</div>
`),
});
