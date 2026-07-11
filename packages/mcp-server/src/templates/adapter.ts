import type { ViewModelStyle } from './viewmodel.js';

export type Framework = 'react' | 'vue' | 'vanilla' | 'angular' | 'lit';

export interface AdapterTemplateParams {
  name: string;
  framework: Framework;
  viewModelStyle?: ViewModelStyle;
}

export function adapterTemplate(p: AdapterTemplateParams): string {
  const { name, framework, viewModelStyle = 'restful-class' } = p;
  switch (framework) {
    case 'react':
      return reactAdapterTemplate(name, viewModelStyle);
    case 'vue':
      return vueAdapterTemplate(name, viewModelStyle);
    case 'vanilla':
      return vanillaAdapterTemplate(name, viewModelStyle);
    case 'angular':
      return angularAdapterTemplate(name, viewModelStyle);
    case 'lit':
      return litAdapterTemplate(name, viewModelStyle);
  }
}

function loadCommandFor(style: ViewModelStyle): string {
  if (style === 'base-commands') {
    return 'refreshCommand';
  }

  if (style === 'active-signals-list') {
    return 'loadCommand';
  }

  return 'fetchCommand';
}

function classViewModelSetup(name: string): string {
  return `import { ${name}Model } from "./${name}Model.js";
import { ${name}ViewModel } from "./${name}ViewModel.js";`;
}

function factoryViewModelSetup(name: string): string {
  return `import { create${name}ViewModel } from "./${name}ViewModel.js";`;
}

function reactAdapterTemplate(name: string, viewModelStyle: ViewModelStyle): string {
  const usesFactory = viewModelStyle === 'reactive-factory';
  const loadCommand = loadCommandFor(viewModelStyle);
  return `import { useEffect, useState, useSyncExternalStore } from "react";
import type { ReadonlySignal } from "@web-loom/signals-core";
${usesFactory ? factoryViewModelSetup(name) : classViewModelSetup(name)}

function useSignal<T>(sig: ReadonlySignal<T>): T {
  return useSyncExternalStore(sig.subscribe, sig.get, sig.get);
}

export function use${name}() {
  const [vm] = useState(() => {
${
  usesFactory
    ? `    return create${name}ViewModel();`
    : `    const model = new ${name}Model();
    return new ${name}ViewModel(model);`
}
  });

  const data = useSignal(vm.data$);
  const isLoading = useSignal(vm.isLoading$);
  const error = useSignal(vm.error$);

  useEffect(() => {
    vm.${loadCommand}.execute();
    return () => vm.dispose();
  }, [vm]);

  return { data, isLoading, error, vm };
}
`;
}

function vueAdapterTemplate(name: string, viewModelStyle: ViewModelStyle): string {
  const usesFactory = viewModelStyle === 'reactive-factory';
  const loadCommand = loadCommandFor(viewModelStyle);
  return `import { shallowRef, onMounted, onUnmounted, type ShallowRef } from "vue";
import { observe, type ReadonlySignal } from "@web-loom/signals-core";
${usesFactory ? factoryViewModelSetup(name) : classViewModelSetup(name)}

function useSignal<T>(sig: ReadonlySignal<T>): ShallowRef<T> {
  const value = shallowRef<T>(sig.peek());
  const stop = observe(sig, (next) => {
    value.value = next;
  });
  onUnmounted(stop);
  return value;
}

export function use${name}() {
${
  usesFactory
    ? `  const vm = create${name}ViewModel();`
    : `  const model = new ${name}Model();
  const vm = new ${name}ViewModel(model);`
}

  const data = useSignal(vm.data$);
  const isLoading = useSignal(vm.isLoading$);
  const error = useSignal(vm.error$);

  onMounted(() => { vm.${loadCommand}.execute(); });
  onUnmounted(() => {
    vm.dispose();
  });

  return { data, isLoading, error, vm };
}
`;
}

function vanillaAdapterTemplate(name: string, viewModelStyle: ViewModelStyle): string {
  const usesFactory = viewModelStyle === 'reactive-factory';
  const loadCommand = loadCommandFor(viewModelStyle);
  return `import { observe } from "@web-loom/signals-core";
${usesFactory ? factoryViewModelSetup(name) : classViewModelSetup(name)}

export function create${name}Controller() {
${
  usesFactory
    ? `  const vm = create${name}ViewModel();`
    : `  const model = new ${name}Model();
  const vm = new ${name}ViewModel(model);`
}

  const teardowns = [
    observe(vm.data$, (data) => {
      // TODO: update DOM with data
      console.log("data:", data);
    }),
    observe(vm.isLoading$, (loading) => {
      // TODO: show/hide loader
      console.log("loading:", loading);
    }),
    observe(vm.error$, (err) => {
      if (err) console.error("error:", err);
    }),
  ];

  vm.${loadCommand}.execute();

  return {
    vm,
    dispose() {
      teardowns.forEach((teardown) => teardown());
      vm.dispose();
    },
  };
}
`;
}

function angularAdapterTemplate(name: string, viewModelStyle: ViewModelStyle): string {
  const usesFactory = viewModelStyle === 'reactive-factory';
  const loadCommand = loadCommandFor(viewModelStyle);
  return `import { DestroyRef, Injectable, OnDestroy, inject, signal, type Signal } from "@angular/core";
import type { ReadonlySignal } from "@web-loom/signals-core";
${usesFactory ? factoryViewModelSetup(name) : classViewModelSetup(name)}

function fromLoomSignal<T>(source: ReadonlySignal<T>, destroyRef: DestroyRef): Signal<T> {
  const mirror = signal<T>(source.peek());
  const stop = source.subscribe((value) => mirror.set(value));
  destroyRef.onDestroy(stop);
  return mirror.asReadonly();
}

@Injectable()
export class ${name}Service implements OnDestroy {
${
  usesFactory
    ? `  readonly vm = create${name}ViewModel();`
    : `  private readonly _model = new ${name}Model();
  readonly vm = new ${name}ViewModel(this._model);`
}
  private readonly destroyRef = inject(DestroyRef);

  readonly data = fromLoomSignal(this.vm.data$, this.destroyRef);
  readonly isLoading = fromLoomSignal(this.vm.isLoading$, this.destroyRef);
  readonly error = fromLoomSignal(this.vm.error$, this.destroyRef);

  constructor() {
    this.vm.${loadCommand}.execute();
  }

  ngOnDestroy(): void {
    this.vm.dispose();
  }
}
`;
}

function litAdapterTemplate(name: string, viewModelStyle: ViewModelStyle): string {
  const usesFactory = viewModelStyle === 'reactive-factory';
  const loadCommand = loadCommandFor(viewModelStyle);
  const elementName = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

  return `import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { observe } from "@web-loom/signals-core";
${usesFactory ? factoryViewModelSetup(name) : classViewModelSetup(name)}

@customElement("${elementName}-view")
export class ${name}ViewElement extends LitElement {
${
  usesFactory
    ? `  private readonly vm = create${name}ViewModel();`
    : `  private readonly model = new ${name}Model();
  private readonly vm = new ${name}ViewModel(this.model);`
}
  private readonly teardowns: Array<() => void> = [];

  @state()
  private data = this.vm.data$.peek();

  @state()
  private isLoading = this.vm.isLoading$.peek();

  @state()
  private error = this.vm.error$.peek();

  connectedCallback(): void {
    super.connectedCallback();
    this.teardowns.push(
      observe(this.vm.data$, (value) => {
        this.data = value;
      }),
      observe(this.vm.isLoading$, (value) => {
        this.isLoading = value;
      }),
      observe(this.vm.error$, (value) => {
        this.error = value;
      })
    );
    void this.vm.${loadCommand}.execute();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.teardowns.splice(0).forEach((teardown) => teardown());
    this.vm.dispose();
  }

  render() {
    return html\`
      \${this.isLoading ? html\`<p>Loading...</p>\` : null}
      \${this.error ? html\`<p role="alert">\${String(this.error)}</p>\` : null}
      <pre>\${JSON.stringify(this.data, null, 2)}</pre>
    \`;
  }
}
`;
}
