import { signal, type ReadonlySignal } from '@web-loom/signals-core';
import { EventSource, type EventSubscribable } from '../utilities/event-source';

/**
 * @interface IObservableCollection
 * Defines the public interface for an ObservableCollection.
 * `items$` is a reactive signal holding the current items; the `itemAdded$`,
 * `itemRemoved$`, and `itemUpdated$` streams are event sources — they deliver
 * every occurrence and have no current value.
 * @template T The type of items in the collection.
 */
export interface IObservableCollection<T> {
  readonly items$: ReadonlySignal<T[]>;
  readonly itemAdded$: EventSubscribable<T>;
  readonly itemRemoved$: EventSubscribable<T>;
  readonly itemUpdated$: EventSubscribable<{ oldItem: T; newItem: T }>;

  add(item: T): void;
  remove(predicate: (item: T) => boolean): void;
  update(predicate: (item: T) => boolean, newItem: T): void;
  clear(): void;
  setItems(newItems: T[]): void;
  toArray(): T[];
  get length(): number;
}

/**
 * @class ObservableCollection
 * A collection that emits notifications when its contents change (add, remove, update).
 * Useful for reactively managing lists of items in an MVVM application.
 * @template T The type of items in the collection.
 */
export class ObservableCollection<T> implements IObservableCollection<T> {
  protected _items: T[] = [];
  protected _items$ = signal<T[]>([]);
  public readonly items$: ReadonlySignal<T[]> = this._items$.asReadonly();

  protected _itemAdded$ = new EventSource<T>();
  public readonly itemAdded$: EventSubscribable<T> = this._itemAdded$;

  protected _itemRemoved$ = new EventSource<T>();
  public readonly itemRemoved$: EventSubscribable<T> = this._itemRemoved$;

  protected _itemUpdated$ = new EventSource<{ oldItem: T; newItem: T }>();
  public readonly itemUpdated$: EventSubscribable<{ oldItem: T; newItem: T }> = this._itemUpdated$;

  constructor(initialItems: T[] = []) {
    this.setItems(initialItems);
  }

  /**
   * Adds an item to the collection.
   * @param item The item to add.
   */
  public add(item: T): void {
    this._items.push(item);
    this._items$.set([...this._items]); // Emit a new array reference
    this._itemAdded$.emit(item);
  }

  /**
   * Removes items from the collection based on a predicate.
   * @param predicate A function that returns true for items to be removed.
   */
  public remove(predicate: (item: T) => boolean): void {
    const itemsToRemove: T[] = [];
    const remainingItems: T[] = [];

    this._items.forEach((item) => {
      if (predicate(item)) {
        itemsToRemove.push(item);
      } else {
        remainingItems.push(item);
      }
    });

    if (itemsToRemove.length > 0) {
      this._items = remainingItems;
      this._items$.set([...this._items]); // Emit new array reference
      itemsToRemove.forEach((item) => this._itemRemoved$.emit(item));
    }
  }

  /**
   * Updates an item in the collection based on a predicate.
   * Emits `itemUpdated$` if an item is found and updated.
   * Note: This assumes `newItem` will replace the existing item, and you might need an ID-based comparison
   * or a deep merge depending on your specific update logic.
   * @param predicate A function that returns true for the item to be updated.
   * @param newItem The new item data.
   */
  public update(predicate: (item: T) => boolean, newItem: T): void {
    const index = this._items.findIndex(predicate);
    if (index > -1) {
      const oldItem = this._items[index];
      this._items[index] = newItem;
      this._items$.set([...this._items]); // Emit a new array reference
      this._itemUpdated$.emit({ oldItem, newItem });
    }
  }

  /**
   * Clears all items from the collection.
   */
  public clear(): void {
    const itemsToClear = [...this._items]; // Capture items before clearing
    this._items = [];
    this._items$.set([]);
    itemsToClear.forEach((item) => this._itemRemoved$.emit(item)); // Emit removed for each item
  }

  /**
   * Replaces all current items in the collection with a new set of items.
   * @param newItems The new array of items.
   */
  public setItems(newItems: T[]): void {
    // More sophisticated logic could compare old and new items
    // and emit specific added/removed/updated events for each change.
    // For simplicity, this implementation just emits a full replacement.
    // If granular events are needed, you'd iterate and call add/remove/update internally.
    this._items = [...newItems];
    this._items$.set(this._items);
    // Note: This simplified setItems does not emit individual itemAdded/Removed/Updated.
    // If granular events are critical for setItems, more complex diffing logic is required.
  }

  /**
   * Returns a shallow copy of the internal items array.
   */
  public toArray(): T[] {
    return [...this._items];
  }

  /**
   * Gets the current number of items in the collection.
   */
  public get length(): number {
    return this._items.length;
  }
}
