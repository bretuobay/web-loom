import { ObservableCollection } from './collections/ObservableCollection';
import { Command } from './commands/Command';
import { TodoItem } from './examples/models/TodoItem';
import { TodoListViewModel } from './examples/viewmodels/TodoListViewModel';
import { BaseModel } from './models/BaseModel';
import { RestfulApiModel } from './models/RestfulApiModel';
import { BaseViewModel } from './viewmodels/BaseViewModel';
import { RestfulApiViewModel } from './viewmodels/RestfulApiViewModel';

export {
  ObservableCollection,
  Command,
  BaseModel,
  RestfulApiModel,
  RestfulApiViewModel,
  BaseViewModel,
  // examples:
  TodoItem,
  TodoListViewModel,
};

export type { Fetcher } from './models/RestfulApiModel';
export type { ICommand } from './commands/Command';
export type { IObservableCollection } from './collections/ObservableCollection';
export type { IBaseModel } from './models/BaseModel';

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
