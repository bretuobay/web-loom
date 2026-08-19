import { declareContext } from '@web-loom/template-core';
import type { AppContext } from '../app/context';

const partial = declareContext<AppContext>();

export const confirmationDialogTemplate = partial.compile(`{{#if state.pendingConfirmation$}}
  <div class="dialog-backdrop" on:click="actions.cancelPending">
    <section class="dialog-card" role="dialog" aria-modal="true" on:click="actions.stopEvent">
      <h3>
        {{ state.pendingConfirmation$.context.title }}
      </h3>
      <p>
        {{ state.pendingConfirmation$.context.content }}
      </p>
      <div class="dialog-actions">
        <button type="button" class="ghost-btn" on:click="actions.cancelPending">
          {{ state.pendingConfirmation$.context.cancelText }}
        </button>
        <button type="button" class="brand-btn" on:click="actions.confirmPending">
          {{ state.pendingConfirmation$.context.confirmText }}
        </button>
      </div>
    </section>
  </div>
{{/if}}
`);
