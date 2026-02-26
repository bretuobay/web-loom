import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Framework } from './detect.js';
import { counterViewModelTemplate } from './templates/shared.js';
import {
  useObservableTemplate as reactHook,
  counterComponentTemplate as reactComponent,
} from './templates/react.js';
import {
  useObservableTemplate as vueComposable,
  counterComponentTemplate as vueComponent,
} from './templates/vue.js';
import {
  counterTemplate as vanillaCounter,
  counterHtmlTemplate as vanillaHtml,
} from './templates/vanilla.js';

function write(filePath: string, content: string): void {
  mkdirSync(join(filePath, '..'), { recursive: true });
  writeFileSync(filePath, content, 'utf8');
}

export function injectBoilerplate(projectDir: string, framework: Framework): void {
  const src = join(projectDir, 'src');

  // Shared ViewModel written for all frameworks
  write(join(src, 'viewmodels', 'CounterViewModel.ts'), counterViewModelTemplate);

  switch (framework) {
    case 'react':
      write(join(src, 'hooks', 'useObservable.ts'), reactHook);
      write(join(src, 'components', 'Counter.tsx'), reactComponent);
      break;

    case 'vue':
      write(join(src, 'composables', 'useObservable.ts'), vueComposable);
      write(join(src, 'components', 'Counter.vue'), vueComponent);
      break;

    default:
      // vanilla, lit, angular, svelte — write a basic TS counter entry
      write(join(src, 'counter.ts'), vanillaCounter);
      write(join(projectDir, 'counter.html'), vanillaHtml);
      break;
  }
}
