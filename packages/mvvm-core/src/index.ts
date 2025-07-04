import { ObservableCollection } from './collections/ObservableCollection';
import { Command } from './commands/Command';
import { TodoItem } from './examples/models/TodoItem';
import { TodoListViewModel } from './examples/viewmodels/TodoListViewModel';
import { BaseModel } from './models/BaseModel';
import { RestfulApiModel } from './models/RestfulApiModel';
import { CachedRestfulApiModel } from './models/CachedRestfulApiModel'; // Added
import { BaseViewModel } from './viewmodels/BaseViewModel';
import { RestfulApiViewModel } from './viewmodels/RestfulApiViewModel';
import { CachedRestfulApiViewModel } from './viewmodels/CachedRestfulApiViewModel'; // Added

export {
  ObservableCollection,
  Command,
  BaseModel,
  RestfulApiModel,
  CachedRestfulApiModel, // Added
  RestfulApiViewModel,
  CachedRestfulApiViewModel, // Added
  BaseViewModel,
  // examples:
  TodoItem,
  TodoListViewModel,
};

export type { Fetcher, ExtractItemType as ExtractRestfulItemType } from './models/RestfulApiModel'; // Renamed ExtractItemType
export type {
  TCachedConstructorInput,
  ExtractItemType as ExtractCachedItemType, // Renamed ExtractItemType
} from './models/CachedRestfulApiModel';
export type { ICommand } from './commands/Command';
export type { IObservableCollection } from './collections/ObservableCollection';
export type { IBaseModel } from './models/BaseModel';
export type { IRestfulApiModel } from './models/RestfulApiModel';
export type { ICachedRestfulApiModel } from './models/CachedRestfulApiModel';

// Exports for Restful Todo Example
export { FakeTodoApi } from './examples/api/FakeTodoApi';
export { RestfulTodoSchema, RestfulTodoListSchema } from './examples/models/RestfulTodoSchema';
export type { RestfulTodoData, RestfulTodoListData } from './examples/models/RestfulTodoSchema';
export { RestfulTodoModel, RestfulTodoListModel } from './examples/models/RestfulTodoModel';
export type {
  TRestfulTodoConstructorInput,
  TRestfulTodoListConstructorInput,
} from './examples/models/RestfulTodoModel';
export { RestfulTodoViewModel } from './examples/viewmodels/RestfulTodoViewModel';

export * from './utilities';
