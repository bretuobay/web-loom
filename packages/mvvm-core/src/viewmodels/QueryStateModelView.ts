import { Observable } from 'rxjs';
import { IQueryStateModel, ExtractItemType } from '../models/QueryStateModel';
import { Command } from '../commands/Command';
import { ZodSchema } from 'zod';

// We might not need selectedItem$ and selectItem functionality if CUD operations
// are handled differently or are not a primary concern for this cached view model.
// For now, let's include it for feature parity if data is an array.
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

// Helper type to check if TData is an array and extract item type
type ItemWithId = { id: string; [key: string]: any };

/**
 * @class QueryStateModelView
 * A generic ViewModel to facilitate interactions with a QueryStateModel.
 * It exposes data, loading states, errors, and commands to refresh or invalidate the cache.
 * @template TData The type of data managed by the underlying QueryStateModel (e.g., User, User[]).
 * @template TModelSchema The Zod schema type for validating TData, matching the schema used by the model.
 */
export class QueryStateModelView<TData, TModelSchema extends ZodSchema<TData>> {
  protected model: IQueryStateModel<TData, TModelSchema>;

  /**
   * Exposes the current data from the QueryStateModel.
   */
  public readonly data$: Observable<TData | null>;

  /**
   * Exposes the loading state of the QueryStateModel.
   */
  public readonly isLoading$: Observable<boolean>;

  /**
   * Exposes any error encountered by the QueryStateModel.
   */
  public readonly error$: Observable<any>;

  // Commands for cache operations
  /**
   * Command to trigger a refetch of the data.
   * Takes an optional boolean parameter `force` (defaults to false).
   * If `force` is true, it may ignore `refetchAfter` settings in QueryCore.
   */
  public readonly refetchCommand: Command<boolean | void, void>; // Parameter `force` can be boolean or void

  /**
   * Command to invalidate the cached data for the endpoint.
   */
  public readonly invalidateCommand: Command<void, void>;

  // Optional: Selected item logic if TData is an array
  public readonly selectedItem$: Observable<ExtractItemType<TData> | null>;
  protected readonly _selectedItemId$ = new BehaviorSubject<string | null>(null);

  /**
   * @param model An instance of QueryStateModel that this ViewModel will manage.
   */
  constructor(model: IQueryStateModel<TData, TModelSchema>) {
    // It's good practice to check if the provided model is of the expected type,
    // but IQueryStateModel is an interface. instanceof won't work directly with interfaces.
    // We rely on TypeScript's structural typing or add a runtime check if necessary (e.g., check for specific methods).
    if (!model || typeof model.refetch !== 'function' || typeof model.invalidate !== 'function') {
      throw new Error('QueryStateModelView requires a valid model instance that implements IQueryStateModel.');
    }
    this.model = model;

    this.data$ = this.model.data$;
    this.isLoading$ = this.model.isLoading$;
    this.error$ = this.model.error$;

    // Initialize Commands
    this.refetchCommand = new Command(async (force: boolean | void) => {
      // If force is boolean, pass it. If it's void (runtime undefined), pass undefined to model.refetch.
      const forceParam = typeof force === 'boolean' ? force : undefined;
      await this.model.refetch(forceParam);
    });

    this.invalidateCommand = new Command(async () => {
      await this.model.invalidate();
    });

    // Selected item logic (similar to RestfulApiViewModel)
    this.selectedItem$ = combineLatest([this.model.data$, this._selectedItemId$]).pipe(
      map(([data, selectedId]) => {
        if (Array.isArray(data) && selectedId) {
          const itemWithId = data.find((item: unknown): item is ItemWithId => {
            return (
              typeof item === 'object' &&
              item !== null &&
              'id' in item &&
              typeof (item as any).id === 'string' &&
              (item as any).id === selectedId
            );
          });
          return (itemWithId as ExtractItemType<TData>) || null;
        }
        return null;
      }),
      startWith(null),
    );
  }

  /**
   * Selects an item by its ID. Useful if TData is an array of items.
   * @param id The ID of the item to select. Pass null to clear selection.
   */
  public selectItem(id: string | null): void {
    this._selectedItemId$.next(id);
  }

  /**
   * Disposes of resources held by the ViewModel.
   * This includes disposing of the underlying model and any commands.
   */
  public dispose(): void {
    this.model.dispose();
    this.refetchCommand.dispose();
    this.invalidateCommand.dispose();
    this._selectedItemId$.complete();
  }
}
