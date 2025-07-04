import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CachedRestfulApiModel, ExtractItemType } from '../models/CachedRestfulApiModel';
import { Command } from '../commands/Command';
import { ZodSchema } from 'zod';

// Helper type for items with an ID, assuming a common structure
type ItemWithId = { id: string; [key: string]: any };

/**
 * @class CachedRestfulApiViewModel
 * A generic ViewModel to facilitate operations and state management for a
 * CachedRestfulApiModel. It exposes data, loading states, and errors as observables,
 * and operations as commands, leveraging QueryCore through the model.
 * @template TData The type of data managed by the underlying CachedRestfulApiModel.
 * @template TSchema The Zod schema type for validating the data.
 */
export class CachedRestfulApiViewModel<TData, TSchema extends ZodSchema<TData>> {
  protected model: CachedRestfulApiModel<TData, TSchema>;

  /**
   * Exposes the current data from the CachedRestfulApiModel.
   */
  public readonly data$: Observable<TData | null>;

  /**
   * Exposes the loading state from the CachedRestfulApiModel.
   */
  public readonly isLoading$: Observable<boolean>;

  /**
   * Exposes any error from the CachedRestfulApiModel.
   */
  public readonly error$: Observable<any>;

  // Commands
  public readonly queryCommand: Command<boolean | void, void>; // Parameter: forceRefetch (optional)
  public readonly createCommand: Command<Partial<ExtractItemType<TData>> | Partial<ExtractItemType<TData>>[], void>;
  public readonly updateCommand: Command<{ id: string; payload: Partial<ExtractItemType<TData>> }, void>;
  public readonly deleteCommand: Command<string, void>;

  // Optional: For managing selection if TData is an array of items
  public readonly selectedItem$: Observable<ExtractItemType<TData> | null>;
  protected readonly _selectedItemId$ = new BehaviorSubject<string | null>(null);

  /**
   * @param model An instance of CachedRestfulApiModel that this ViewModel will manage.
   */
  constructor(model: CachedRestfulApiModel<TData, TSchema>) {
    if (!(model instanceof CachedRestfulApiModel)) {
      throw new Error('CachedRestfulApiViewModel requires an instance of CachedRestfulApiModel.');
    }
    this.model = model;

    this.data$ = this.model.data$;
    this.isLoading$ = this.model.isLoading$;
    this.error$ = this.model.error$;

    // Initialize Commands
    this.queryCommand = new Command(async (forceRefetch?: boolean) => {
      await this.model.query(forceRefetch || false);
    });

    this.createCommand = new Command(
      async (payload: Partial<ExtractItemType<TData>> | Partial<ExtractItemType<TData>>[]) => {
        await this.model.create(payload);
      },
    );

    this.updateCommand = new Command(
      async ({ id, payload }: { id: string; payload: Partial<ExtractItemType<TData>> }) => {
        await this.model.update(id, payload);
      },
    );

    this.deleteCommand = new Command(async (id: string) => {
      await this.model.delete(id);
    });

    // Selected item logic (meaningful if TData is an array)
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
   * Selects an item by its ID.
   * @param id The ID of the item to select. Pass null to clear selection.
   */
  public selectItem(id: string | null): void {
    this._selectedItemId$.next(id);
  }

  /**
   * Disposes of resources held by the ViewModel.
   */
  public dispose(): void {
    this.model.dispose();
    this.queryCommand.dispose();
    this.createCommand.dispose();
    this.updateCommand.dispose();
    this.deleteCommand.dispose();
    this._selectedItemId$.complete();
  }
}
