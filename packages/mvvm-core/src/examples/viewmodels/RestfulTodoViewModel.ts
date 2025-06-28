import { RestfulApiViewModel } from '../../viewmodels/RestfulApiViewModel'; // Adjusted path
import { RestfulTodoListModel } from '../models/RestfulTodoModel'; // Adjusted path
import { RestfulTodoData, RestfulTodoListData, RestfulTodoListSchema } from '../models/RestfulTodoSchema'; // Adjusted path
import { Command } from '../../commands/Command'; // Adjusted path
import { Observable } from 'rxjs';

/**
 * @class RestfulTodoViewModel
 * Extends RestfulApiViewModel to manage a list of Todo items from a REST API.
 * It uses RestfulTodoListModel for data operations.
 */
export class RestfulTodoViewModel extends RestfulApiViewModel<RestfulTodoListData, typeof RestfulTodoListSchema> {
  // Expose the list of todos directly. TData is RestfulTodoListData (RestfulTodoData[])
  public readonly todos$: Observable<RestfulTodoData[] | null>;

  // Command to add a new todo. The payload will be Partial<RestfulTodoData>
  // The createCommand from the base class takes Partial<RestfulTodoListData>,
  // which is not what we want for adding a single todo item.
  // We need a custom command or adapt the createCommand if possible.
  // For now, let's define a specific add command.
  public readonly addTodoCommand: Command<
    Partial<Omit<RestfulTodoData, 'id' | 'createdAt' | 'updatedAt'>>,
    Promise<RestfulTodoData | undefined>
  >;

  // Command to update a todo.
  // The updateCommand from base class is fine: { id: string; payload: Partial<RestfulTodoListData> }
  // but we are updating a single item in the list.
  // The model's update method refers to TData, which is RestfulTodoListData.
  // This means model.update() is not suitable for updating a single item in a list directly.
  // We need to manage this more carefully. Typically, the RestfulApiModel would be for a single resource or a collection.
  // If RestfulTodoListModel is for the *collection*, its update method might not be item-specific.
  // Let's assume the base `updateCommand` is intended for the whole collection,
  // and we need a specific one for individual items if the API supports it.
  // Or, the `RestfulApiModel`'s `update` method is smart enough to handle it if `TData` is an array.
  // Reviewing `RestfulApiModel.update`, it seems designed for updating a single resource (this.getUrl(id))
  // or an item within a collection if `TData` is an array and `id` matches. This should work.
  public readonly updateTodoCommand: Command<
    { id: string; payload: Partial<RestfulTodoData> },
    Promise<RestfulTodoData | undefined>
  >;

  // deleteCommand from base class is fine: string (id)
  // model.delete(id) should also work for deleting an item from a collection.

  constructor(model: RestfulTodoListModel) {
    super(model);
    this.todos$ = this.data$ as Observable<RestfulTodoData[] | null>; // TData is RestfulTodoData[]

    // Custom command for adding a new todo item
    this.addTodoCommand = new Command(
      async (newTodoData: Partial<Omit<RestfulTodoData, 'id' | 'createdAt' | 'updatedAt'>>) => {
        // The model's `create` method expects Partial<TData>, where TData is RestfulTodoListData (an array).
        // This is not correct for creating a single new item to be added to the list.
        // The `RestfulApiModel.create` method is designed to POST to the base endpoint (`this.getUrl()`)
        // and then optimistically updates its `_data$` (which is the list).
        // So, the payload to `model.create` should be the new single Todo item.
        return this.model.create(
          // @ts-ignore
          newTodoData as Partial<RestfulTodoData | any>,
        ) as Promise<RestfulTodoData | any>;
      },
      // Can-execute observable (e.g., based on form validity if there was one)
      new Observable<boolean>((subscriber) => subscriber.next(true)), // Always executable for now
    );

    // Command for updating a specific todo item
    // The base class `updateCommand` might be sufficient if RestfulApiModel's update
    // correctly handles items in a collection.
    // `this.model.update(id, payload)` where payload is `Partial<RestfulTodoData>`
    this.updateTodoCommand = new Command(async ({ id, payload }: { id: string; payload: Partial<RestfulTodoData> }) => {
      // The payload for model.update should be Partial<ExtractItemType<TData>>
      // which is Partial<RestfulTodoData>. This is correct.
      return this.model.update(id, payload as any) as Promise<RestfulTodoData | any>;
    });
  }

  // Expose a method to easily toggle completion, assuming the API supports PATCH or PUT for partial updates.
  // This demonstrates how to build specific actions on top of the generic commands/model methods.
  public async toggleTodoCompletion(id: string): Promise<void> {
    const todos = await this.todos$.toPromise(); // Not ideal in a reactive world, but for simplicity
    const todo = todos?.find((t) => t.id === id);
    if (todo) {
      await this.updateTodoCommand.execute({
        id,
        payload: { isCompleted: !todo.isCompleted },
      });
    } else {
      console.warn(`Todo with id ${id} not found for toggling completion.`);
    }
  }

  public dispose(): void {
    super.dispose(); // Disposes base commands (fetch, create, update, delete)
    this.addTodoCommand.dispose();
    this.updateTodoCommand.dispose();
    // Any other custom commands should be disposed here
  }
}

// Example of a ViewModel for a single Todo item, if needed (e.g., for a detail view)
// export class RestfulTodoItemViewModel extends RestfulApiViewModel<RestfulTodoData, typeof RestfulTodoSchema> {
//   constructor(model: RestfulTodoModel) {
//     super(model);
//   }
//
//   public async toggleCompletion(): Promise<void> {
//     const currentData = this.model.getData();
//     if (currentData) {
//       // This assumes the RestfulTodoModel has an 'update' method or similar
//       // or this ViewModel uses its updateCommand.
//       await this.updateCommand.execute({ id: currentData.id, payload: { isCompleted: !currentData.isCompleted }});
//     }
//   }
// }
