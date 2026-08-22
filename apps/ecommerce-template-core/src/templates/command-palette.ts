import { declareContext } from '@web-loom/template-core';
import { defineComponent } from '@web-loom/view';
import type { CommandPaletteState } from '@web-loom/ui-patterns';

export interface CommandPaletteProps {
  palette: CommandPaletteState;
  onClose: () => void;
  onStop: (event: Event) => void;
  onQuery: (event: Event) => void;
  onKey: (event: Event) => void;
  onExecute: (event: Event) => void;
}

const card = declareContext<CommandPaletteProps>();

export const commandPaletteTemplate = defineComponent<CommandPaletteProps>({
  name: 'palette',
  props: ['palette', 'onClose', 'onStop', 'onQuery', 'onKey', 'onExecute'],
  template: card.compile(`{{#if palette.isOpen}}
  <div class="palette-backdrop" on:click="onClose">
    <div class="palette-dialog" on:click="onStop">
      <input class="palette-input" autofocus :value="palette.query"
          on:input="onQuery" on:keydown="onKey"
          placeholder="Type a command">
      <ul class="palette-list">
        {{#if palette.filteredCommands.length > 0}}
          {{#each palette.filteredCommands key=id}}
            <li>
              <button class="palette-item" data-command-id="{{ id }}" class:active="../palette.selectedIndex === @index" type="button"
                on:click="onExecute">
                <span>
                  {{ label }}
                </span>
                <small>
                  {{ category }}
                </small>
              </button>
            </li>
          {{/each}}
          {{else}}
          <li class="palette-empty">
            No commands found.
          </li>
        {{/if}}
      </ul>
    </div>
  </div>
{{/if}}
`),
});
