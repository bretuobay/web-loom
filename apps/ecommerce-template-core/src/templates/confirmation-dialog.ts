import { declareContext } from '@web-loom/template-core';
import { defineComponent } from '@web-loom/view';
import type { PendingConfirmation } from '../app/types';

export interface ConfirmationDialogProps {
  pending: PendingConfirmation | null;
  onCancel: () => void;
  onConfirm: () => void;
  onStop: (event: Event) => void;
}

const card = declareContext<ConfirmationDialogProps>();

export const confirmationDialogTemplate = defineComponent<ConfirmationDialogProps>({
  name: 'confirmation',
  props: ['pending', 'onCancel', 'onConfirm', 'onStop'],
  template: card.compile(`{{#if pending}}
  <div class="dialog-backdrop" on:click="onCancel">
    <section class="dialog-card" role="dialog" aria-modal="true" on:click="onStop">
      <h3>
        {{ pending.context.title }}
      </h3>
      <p>
        {{ pending.context.content }}
      </p>
      <div class="dialog-actions">
        <button type="button" class="ghost-btn" on:click="onCancel">
          {{ pending.context.cancelText }}
        </button>
        <button type="button" class="brand-btn" on:click="onConfirm">
          {{ pending.context.confirmText }}
        </button>
      </div>
    </section>
  </div>
{{/if}}
`),
});
