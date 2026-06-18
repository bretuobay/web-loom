export type Framework = "react" | "vue" | "vanilla" | "angular";

export interface AdapterTemplateParams {
  name: string;
  framework: Framework;
}

export function adapterTemplate(p: AdapterTemplateParams): string {
  const { name, framework } = p;
  switch (framework) {
    case "react":
      return reactAdapterTemplate(name);
    case "vue":
      return vueAdapterTemplate(name);
    case "vanilla":
      return vanillaAdapterTemplate(name);
    case "angular":
      return angularAdapterTemplate(name);
  }
}

function reactAdapterTemplate(name: string): string {
  return `import { useEffect, useState } from "react";
import type { Observable } from "rxjs";
import { ${name}Model } from "./${name}Model.js";
import { ${name}ViewModel } from "./${name}ViewModel.js";

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
    const model = new ${name}Model();
    return new ${name}ViewModel(model);
  });

  const data = useObservable(vm.data$, null);
  const isLoading = useObservable(vm.isLoading$, false);
  const error = useObservable(vm.error$, null);

  useEffect(() => {
    vm.fetchCommand.execute();
    return () => vm.dispose();
  }, [vm]);

  return { data, isLoading, error, vm };
}
`;
}

function vueAdapterTemplate(name: string): string {
  return `import { ref, onMounted, onUnmounted } from "vue";
import { ${name}Model } from "./${name}Model.js";
import { ${name}ViewModel } from "./${name}ViewModel.js";

export function use${name}() {
  const model = new ${name}Model();
  const vm = new ${name}ViewModel(model);

  const data = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  const subscriptions = [
    vm.data$.subscribe((v) => { data.value = v; }),
    vm.isLoading$.subscribe((v) => { isLoading.value = v; }),
    vm.error$.subscribe((v) => { error.value = v; }),
  ];

  onMounted(() => { vm.fetchCommand.execute(); });
  onUnmounted(() => {
    subscriptions.forEach((s) => s.unsubscribe());
    vm.dispose();
  });

  return { data, isLoading, error, vm };
}
`;
}

function vanillaAdapterTemplate(name: string): string {
  return `import { ${name}Model } from "./${name}Model.js";
import { ${name}ViewModel } from "./${name}ViewModel.js";

export function create${name}Controller() {
  const model = new ${name}Model();
  const vm = new ${name}ViewModel(model);

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

  vm.fetchCommand.execute();

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

function angularAdapterTemplate(name: string): string {
  return `import { Injectable, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { ${name}Model } from "./${name}Model.js";
import { ${name}ViewModel } from "./${name}ViewModel.js";

@Injectable()
export class ${name}Service implements OnDestroy {
  private readonly _model = new ${name}Model();
  readonly vm = new ${name}ViewModel(this._model);
  private readonly _subs = new Subscription();

  constructor() {
    this.vm.fetchCommand.execute();
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
    this.vm.dispose();
  }
}
`;
}
