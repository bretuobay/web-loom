import { BaseModel } from '../../models/BaseModel';
import { BaseViewModel } from '../../viewmodels/BaseViewModel';

export interface GenericViewModelFactoryConfig<
  M extends BaseModel<any, any>,
  V extends BaseViewModel<M>,
  ModelArgs extends any[],
> {
  modelConstructor: new (...args: ModelArgs) => M;
  modelConstructorParams: ModelArgs;
  viewModelConstructor: new (model: M) => V;
}

export function createGenericViewModel<
  M extends BaseModel<any, any>,
  V extends BaseViewModel<M>,
  ModelArgs extends any[],
>(config: GenericViewModelFactoryConfig<M, V, ModelArgs>): V {
  const model = new config.modelConstructor(...config.modelConstructorParams);
  const viewModel = new config.viewModelConstructor(model);
  return viewModel;
}
