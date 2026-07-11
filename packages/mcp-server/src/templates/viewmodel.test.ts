import { describe, expect, it } from 'vitest';
import { adapterTemplate } from './adapter.js';
import { viewModelTemplate } from './viewmodel.js';

describe('viewModelTemplate', () => {
  it('generates the default RestfulApiViewModel class', () => {
    const code = viewModelTemplate({ name: 'Product', modelClass: 'ProductModel' });

    expect(code).toContain('import { RestfulApiViewModel } from "@web-loom/mvvm-core";');
    expect(code).toContain('import type { ProductListData, ProductListSchema } from "./ProductModel.js";');
    expect(code).toContain('export class ProductViewModel extends RestfulApiViewModel');
    expect(code).toContain('public override dispose(): void');
  });

  it('generates custom commands for class templates', () => {
    const code = viewModelTemplate({
      name: 'Product',
      modelClass: 'ProductModel',
      customCommands: [{ name: 'archiveCommand', paramType: 'string', resultType: 'void' }],
    });

    expect(code).toContain('import { RestfulApiViewModel, Command } from "@web-loom/mvvm-core";');
    expect(code).toContain('private registerCustomCommand<TParam, TResult>');
    expect(code).toContain('public readonly archiveCommand = this.registerCustomCommand');
    expect(code).toContain('new Command<string, void>');
    expect(code).toContain('this.customCommands.forEach((command) => command.dispose())');
  });

  it('generates a reactive factory ViewModel', () => {
    const code = viewModelTemplate({
      name: 'Product',
      modelClass: 'ProductModel',
      style: 'reactive-factory',
    });

    expect(code).toContain('createReactiveViewModel');
    expect(code).toContain('type ProductViewModelConfig = ViewModelFactoryConfig');
    expect(code).toContain('modelConfig: productConfig');
    expect(code).toContain('export function createProductViewModel()');
    expect(code).toContain('export const productViewModel = createProductViewModel()');
  });

  it('generates a BaseViewModel command template', () => {
    const code = viewModelTemplate({
      name: 'Session',
      modelClass: 'SessionModel',
      style: 'base-commands',
      customCommands: [{ name: 'signInCommand', paramType: 'SignInPayload', resultType: 'SessionData' }],
    });

    expect(code).toContain('import { BaseViewModel, Command } from "@web-loom/mvvm-core";');
    expect(code).toContain('export class SessionViewModel extends BaseViewModel<SessionModel>');
    expect(code).toContain('new Command<SignInPayload, SessionData>');
  });

  it('generates an active signals list template', () => {
    const code = viewModelTemplate({
      name: 'Catalog',
      modelClass: 'CatalogModel',
      style: 'active-signals-list',
      dataType: 'CatalogProductDto[]',
      itemType: 'CatalogProductDto',
    });

    expect(code).toContain('import { ActiveAwareViewModel } from "@web-loom/mvvm-patterns";');
    expect(code).toContain('import { computed, signal, type ReadonlySignal } from "@web-loom/signals-core";');
    expect(code).toContain('import type { CatalogProductDto } from "./CatalogModel.js";');
    expect(code).toContain('type CatalogListData = CatalogProductDto[];');
    expect(code).toContain('public readonly filteredItems = computed');
    expect(code).toContain('protected override onIsActiveChanged');
  });

  it('generates adapters that match non-default ViewModel styles', () => {
    const reactiveCode = adapterTemplate({
      name: 'Product',
      framework: 'react',
      viewModelStyle: 'reactive-factory',
    });
    const activeCode = adapterTemplate({
      name: 'Catalog',
      framework: 'vanilla',
      viewModelStyle: 'active-signals-list',
    });

    expect(reactiveCode).toContain('import { createProductViewModel } from "./ProductViewModel.js";');
    expect(reactiveCode).toContain('return createProductViewModel();');
    expect(reactiveCode).toContain('vm.fetchCommand.execute();');
    expect(activeCode).toContain('new CatalogViewModel(model)');
    expect(activeCode).toContain('vm.loadCommand.execute();');
  });

  it('generates framework adapters with signals-core bridges instead of RxJS subscriptions', () => {
    const reactCode = adapterTemplate({
      name: 'Product',
      framework: 'react',
    });
    const vueCode = adapterTemplate({
      name: 'Product',
      framework: 'vue',
    });
    const angularCode = adapterTemplate({
      name: 'Product',
      framework: 'angular',
    });
    const vanillaCode = adapterTemplate({
      name: 'Product',
      framework: 'vanilla',
    });
    const litCode = adapterTemplate({
      name: 'Product',
      framework: 'lit',
    });
    const allCode = [reactCode, vueCode, angularCode, vanillaCode, litCode].join('\n');

    expect(reactCode).toContain('useSyncExternalStore(sig.subscribe, sig.get, sig.get)');
    expect(vueCode).toContain('import { observe, type ReadonlySignal } from "@web-loom/signals-core";');
    expect(angularCode).toContain('function fromLoomSignal<T>');
    expect(vanillaCode).toContain('teardowns.forEach((teardown) => teardown())');
    expect(litCode).toContain('@customElement("product-view")');

    expect(allCode).not.toContain('rxjs');
    expect(allCode).not.toContain('Observable<T>');
    expect(allCode).not.toContain('useObservable');
    expect(allCode).not.toContain('.pipe(');
    expect(allCode).not.toContain('.unsubscribe()');
  });
});
