import type { Disposable, Template, TemplateOutlet } from '../types.js';

export function createTemplateOutlet(container: Element): TemplateOutlet {
  let disposed = false;
  let current: Disposable | null = null;

  const clear = (): void => {
    current?.dispose();
    current = null;
  };

  return {
    show<TVm extends object>(template: Template<TVm>, viewModel: TVm): Disposable {
      if (disposed) throw new Error('Cannot show a template on a disposed TemplateOutlet.');
      clear();
      const mounted = template.mount(container, viewModel);
      const owned: Disposable = {
        dispose: () => {
          mounted.dispose();
          if (current === owned) current = null;
        },
      };
      current = owned;
      return owned;
    },
    clear,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      clear();
    },
  };
}
