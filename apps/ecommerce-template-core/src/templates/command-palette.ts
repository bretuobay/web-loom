import { compile } from '@web-loom/template-core';

export const commandPaletteTemplate = compile(`
  {{#if state.paletteState$.isOpen}}
    <div class="palette-backdrop" on:click="actions.closePalette">
      <div class="palette-dialog" on:click="actions.stopEvent">
        <input class="palette-input" autofocus :value="state.paletteState$.query"
          on:input="setPaletteQueryFromEvent" on:keydown="handlePaletteKey"
          placeholder="Type a command">
        <ul class="palette-list">
          {{#if state.paletteState$.filteredCommands.length > 0}}
            {{#each state.paletteState$.filteredCommands key=id}}
              <li><button class="palette-item" data-command-id="{{ id }}" class:active="../state.paletteState$.selectedIndex === @index" type="button"
                on:click="executePaletteCommand"><span>{{ label }}</span><small>{{ category }}</small></button></li>
            {{/each}}
          {{else}}
            <li class="palette-empty">No commands found.</li>
          {{/if}}
        </ul>
      </div>
    </div>
  {{/if}}
`);
