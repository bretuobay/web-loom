import type { ViewModelStyle } from "./viewmodel.js";

export type Framework = "react" | "vue" | "vanilla" | "angular";

export interface AdapterTemplateParams {
  name: string;
  framework: Framework;
  viewModelStyle?: ViewModelStyle;
}

export function adapterTemplate(p: AdapterTemplateParams): string {
  const { name, framework, viewModelStyle = "restful-class" } = p;
  switch (framework) {
    case "react":
      return reactAdapterTemplate(name, viewModelStyle);
    case "vue":
      return vueAdapterTemplate(name, viewModelStyle);
    case "vanilla":
      return vanillaAdapterTemplate(name, viewModelStyle);
    case "angular":
      return angularAdapterTemplate(name, viewModelStyle);
  }
}

function loadCommandFor(style: ViewModelStyle): string {
  if (style === "base-commands") {
    return "refreshCommand";
  }

  if (style === "active-signals-list") {
    return "loadCommand";
  }

  return "fetchCommand";
}

function classViewModelSetup(name: string): string {
  return `import { ${name}Model } from "./${name}Model.js";
import { ${name}ViewModel } from "./${name}ViewModel.js";`;
}

function factoryViewModelSetup(name: string): string {
  return `import { create${name}ViewModel } from "./${name}ViewModel.js";`;
}

function reactAdapterTemplate(name: string, viewModelStyle: ViewModelStyle): string {
  const usesFactory = viewModelStyle === "reactive-factory";
  const loadCommand = loadCommandFor(viewModelStyle);
  return `import { useEffect, useState } from "react";
import type { Observable } from "rxjs";
${usesFactory ? factoryViewModelSetup(name) : classViewModelSetup(name)}

function useObservable<T>(obs: Observable<T>, initial: T): T {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    const sub = obs.subscribe(setValue);
    return () => sub.unsubscribe();
  }, [obs]);
  return value;
}

export function use${name}() {
  const [vm] = useState(() => {
${usesFactory ? `    return create${name}ViewModel();` : `    const model = new ${name}Model();
    return new ${name}ViewModel(model);`}
  });

  const data = useObservable(vm.data$, null);
  const isLoading = useObservable(vm.isLoading$, false);
  const error = useObservable(vm.error$, null);

  useEffect(() => {
    vm.${loadCommand}.execute();
    return () => vm.dispose();
  }, [vm]);

  return { data, isLoading, error, vm };
}
`;
}

function vueAdapterTemplate(name: string, viewModelStyle: ViewModelStyle): string {
  const usesFactory = viewModelStyle === "reactive-factory";
  const loadCommand = loadCommandFor(viewModelStyle);
  return `import { ref, onMounted, onUnmounted } from "vue";
${usesFactory ? factoryViewModelSetup(name) : classViewModelSetup(name)}

export function use${name}() {
${usesFactory ? `  const vm = create${name}ViewModel();` : `  const model = new ${name}Model();
  const vm = new ${name}ViewModel(model);`}

  const data = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  const subscriptions = [
    vm.data$.subscribe((v) => { data.value = v; }),
    vm.isLoading$.subscribe((v) => { isLoading.value = v; }),
    vm.error$.subscribe((v) => { error.value = v; }),
  ];

  onMounted(() => { vm.${loadCommand}.execute(); });
  onUnmounted(() => {
    subscriptions.forEach((s) => s.unsubscribe());
    vm.dispose();
  });

  return { data, isLoading, error, vm };
}
`;
}

function vanillaAdapterTemplate(name: string, viewModelStyle: ViewModelStyle): string {
  const usesFactory = viewModelStyle === "reactive-factory";
  const loadCommand = loadCommandFor(viewModelStyle);
  return `${usesFactory ? factoryViewModelSetup(name) : classViewModelSetup(name)}

export function create${name}Controller() {
${usesFactory ? `  const vm = create${name}ViewModel();` : `  const model = new ${name}Model();
  const vm = new ${name}ViewModel(model);`}

  const subscriptions = [
    vm.data$.subscribe((data) => {
      // TODO: update DOM with data
      console.log("data:", data);
    }),
    vm.isLoading$.subscribe((loading) => {
      // TODO: show/hide loader
      console.log("loading:", loading);
    }),
    vm.error$.subscribe((err) => {
      if (err) console.error("error:", err);
    }),
  ];

  vm.${loadCommand}.execute();

  return {
    vm,
    dispose() {
      subscriptions.forEach((s) => s.unsubscribe());
      vm.dispose();
    },
  };
}
`;
}

function angularAdapterTemplate(name: string, viewModelStyle: ViewModelStyle): string {
  const usesFactory = viewModelStyle === "reactive-factory";
  const loadCommand = loadCommandFor(viewModelStyle);
  return `import { Injectable, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
${usesFactory ? factoryViewModelSetup(name) : classViewModelSetup(name)}

@Injectable()
export class ${name}Service implements OnDestroy {
${usesFactory ? `  readonly vm = create${name}ViewModel();` : `  private readonly _model = new ${name}Model();
  readonly vm = new ${name}ViewModel(this._model);`}
  private readonly _subs = new Subscription();

  constructor() {
    this.vm.${loadCommand}.execute();
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
    this.vm.dispose();
  }
}
`;
}
