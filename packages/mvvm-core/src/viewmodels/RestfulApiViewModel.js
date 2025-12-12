// src/viewmodels/RestfulApiViewModel.ts
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { RestfulApiModel } from '../models/RestfulApiModel';
import { Command } from '../commands/Command'; // Assuming Command is in '../commands'
/**
 * @class RestfulApiViewModel
 * A generic ViewModel to facilitate CRUD operations and state management for a specific
 * RestfulApiModel. It exposes data, loading states, and operations as observables and commands,
 * making it easy to consume in frontend frameworks.
 * @template TData The type of data managed by the underlying RestfulApiModel (e.g., User, User[]).
 * @template TSchema The Zod schema type for validating the data.
 */
export class RestfulApiViewModel {
    model;
    /**
     * Exposes the current data from the RestfulApiModel.
     * Use this in your UI to bind to the list or single item.
     */
    data$;
    /**
     * Exposes the loading state of the RestfulApiModel.
     * Use this to show spinners or disable UI elements.
     */
    isLoading$;
    /**
     * Exposes any error encountered by the RestfulApiModel.
     * Use this to display error messages to the user.
     */
    error$;
    // Commands for CRUD operations
    fetchCommand;
    createCommand;
    updateCommand;
    deleteCommand;
    // Optional: Example of view-specific state for a collection
    // If TData is an array, you might want to manage selections, filters, etc.
    // This example assumes TData can be an array where items have an 'id'
    selectedItem$;
    _selectedItemId$ = new BehaviorSubject(null);
    /**
     * @param model An instance of RestfulApiModel that this ViewModel will manage.
     */
    constructor(model) {
        if (!(model instanceof RestfulApiModel)) {
            throw new Error('RestfulApiViewModel requires an instance of RestfulApiModel.');
        }
        this.model = model;
        this.data$ = this.model.data$;
        this.isLoading$ = this.model.isLoading$;
        this.error$ = this.model.error$;
        // Initialize Commands
        /** Look into issue with TypeScript:
         * Type 'string | void | string[]' is not assignable to type 'string | string[] | undefined'.
        Type 'void' is not assignable to type 'string | string[] | undefined'.
         */
        this.fetchCommand = new Command(async (id) => {
            // void parameter implies undefined
            const ids = Array.isArray(id) ? id : id ? [id] : undefined;
            await this.model.fetch(ids);
        });
        this.createCommand = new Command(async (payload) => {
            await this.model.create(payload);
        });
        this.updateCommand = new Command(async ({ id, payload }) => {
            await this.model.update(id, payload);
        });
        this.deleteCommand = new Command(async (id) => {
            await this.model.delete(id);
        });
        // Example for selected item (assumes TData is an array of objects with 'id')
        this.selectedItem$ = combineLatest([
            this.model.data$, // Use model.data$ directly for clarity
            this._selectedItemId$,
        ]).pipe(map(([data, selectedId]) => {
            if (Array.isArray(data) && selectedId) {
                // Type guard to ensure items have an 'id' property of type string
                const itemWithId = data.find((item) => {
                    return (typeof item === 'object' &&
                        item !== null &&
                        'id' in item &&
                        typeof item.id === 'string' &&
                        item.id === selectedId);
                });
                return itemWithId || null;
            }
            return null;
        }), startWith(null));
        // Note: No explicit subscription to this.selectedItem$ is made *within* this class,
        // so _selectedItemSubscription is not used for this specific observable.
        // It's declared for good practice if other internal subscriptions were needed.
    }
    /**
     * Selects an item by its ID. Useful for showing details or for editing.
     * This is only meaningful if TData is an array of items with an 'id' property.
     * @param id The ID of the item to select. Pass null to clear selection.
     */
    selectItem(id) {
        this._selectedItemId$.next(id);
    }
    /**
     * Disposes of resources held by the ViewModel.
     * This includes disposing of the underlying model and any commands.
     */
    dispose() {
        this.model.dispose();
        this.fetchCommand.dispose();
        this.createCommand.dispose();
        this.updateCommand.dispose();
        this.deleteCommand.dispose();
        this._selectedItemId$.complete(); // Complete the subject
        // If _selectedItemSubscription was used for an internal subscription:
        // if (this._selectedItemSubscription) {
        //   this._selectedItemSubscription.unsubscribe();
        // }
    }
}
