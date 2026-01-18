import { BehaviorSubject, Observable } from 'rxjs';
import { RestfulApiModel } from '../models/RestfulApiModel';
import { Command } from '../commands/Command';
import { ZodSchema } from 'zod';
type ExtractItemType<T> = T extends (infer U)[] ? U : T;
/**
 * @class RestfulApiViewModel
 * A generic ViewModel to facilitate CRUD operations and state management for a specific
 * RestfulApiModel. It exposes data, loading states, and operations as observables and commands,
 * making it easy to consume in frontend frameworks.
 * @template TData The type of data managed by the underlying RestfulApiModel (e.g., User, User[]).
 * @template TSchema The Zod schema type for validating the data.
 */
export declare class RestfulApiViewModel<TData, TSchema extends ZodSchema<TData>> {
  protected model: RestfulApiModel<TData, TSchema>;
  /**
   * Exposes the current data from the RestfulApiModel.
   * Use this in your UI to bind to the list or single item.
   */
  readonly data$: Observable<TData | null>;
  /**
   * Exposes the loading state of the RestfulApiModel.
   * Use this to show spinners or disable UI elements.
   */
  readonly isLoading$: Observable<boolean>;
  /**
   * Exposes any error encountered by the RestfulApiModel.
   * Use this to display error messages to the user.
   */
  readonly error$: Observable<any>;
  readonly fetchCommand: Command<string | string[] | void, void>;
  readonly createCommand: Command<Partial<ExtractItemType<TData>> | Partial<ExtractItemType<TData>>[], void>;
  readonly updateCommand: Command<
    {
      id: string;
      payload: Partial<ExtractItemType<TData>>;
    },
    void
  >;
  readonly deleteCommand: Command<string, void>;
  readonly selectedItem$: Observable<ExtractItemType<TData> | null>;
  protected readonly _selectedItemId$: BehaviorSubject<string | null>;
  /**
   * @param model An instance of RestfulApiModel that this ViewModel will manage.
   */
  constructor(model: RestfulApiModel<TData, TSchema>);
  /**
   * Selects an item by its ID. Useful for showing details or for editing.
   * This is only meaningful if TData is an array of items with an 'id' property.
   * @param id The ID of the item to select. Pass null to clear selection.
   */
  selectItem(id: string | null): void;
  /**
   * Disposes of resources held by the ViewModel.
   * This includes disposing of the underlying model and any commands.
   */
  dispose(): void;
}
export {};
//# sourceMappingURL=RestfulApiViewModel.d.ts.map
