import { RestfulApiModel, TConstructorInput } from '../../models/RestfulApiModel'; // Adjusted path
import { RestfulTodoSchema, RestfulTodoData, RestfulTodoListSchema, RestfulTodoListData } from './RestfulTodoSchema'; // Adjusted path

// Type for the constructor input, specifically for a single Todo item
export type TRestfulTodoConstructorInput = TConstructorInput<RestfulTodoData, typeof RestfulTodoSchema>;

// Type for the constructor input, specifically for a list of Todo items
export type TRestfulTodoListConstructorInput = TConstructorInput<RestfulTodoListData, typeof RestfulTodoListSchema>;

/**
 * @class RestfulTodoModel
 * Extends RestfulApiModel to manage a single Todo item.
 * It uses the RestfulTodoSchema for data validation.
 */
export class RestfulTodoModel extends RestfulApiModel<RestfulTodoData, typeof RestfulTodoSchema> {
  constructor(input: TRestfulTodoConstructorInput) {
    super({
      ...input,
      schema: RestfulTodoSchema, // Ensure the correct schema is passed
    });
  }

  // You can add specific methods for a single Todo item here if needed
  // For example, a method to toggle completion if the API supports such partial updates directly
  // async toggleCompletion(): Promise<void> {
  //   if (!this.data?.id) throw new Error("Todo item has no ID.");
  //   // Example: PATCH /todos/{id} { isCompleted: !this.data.isCompleted }
  //   // This would require the update method in RestfulApiModel to support PATCH
  //   // or a custom method here to call executeApiRequest directly.
  //   const currentData = this.getData();
  //   if (currentData) {
  //     await this.update(currentData.id, { isCompleted: !currentData.isCompleted });
  //   }
  // }
}

/**
 * @class RestfulTodoListModel
 * Extends RestfulApiModel to manage a collection of Todo items.
 * It uses the RestfulTodoListSchema for data validation.
 */
export class RestfulTodoListModel extends RestfulApiModel<RestfulTodoListData, typeof RestfulTodoListSchema> {
  constructor(input: TRestfulTodoListConstructorInput) {
    super({
      ...input,
      schema: RestfulTodoListSchema, // Ensure the correct schema is passed
    });
  }

  // You can add specific methods for a list of Todo items here if needed
  // For example, fetching completed todos, etc.
  // async fetchCompleted(): Promise<void> {
  //   const url = `${this.getUrl()}?isCompleted=true`; // Assuming API supports filtering
  //   const fetchedData = await this.executeApiRequest(url, { method: 'GET' }, 'collection');
  //   this.setData(fetchedData);
  // }
}
