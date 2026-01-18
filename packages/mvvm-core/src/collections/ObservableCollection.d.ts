import { BehaviorSubject, Observable, Subject } from 'rxjs';
/**
 * @interface IObservableCollection
 * Defines the public interface for an ObservableCollection.
 * @template T The type of items in the collection.
 */
export interface IObservableCollection<T> {
  readonly items$: Observable<T[]>;
  readonly itemAdded$: Observable<T>;
  readonly itemRemoved$: Observable<T>;
  readonly itemUpdated$: Observable<{
    oldItem: T;
    newItem: T;
  }>;
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
export declare class ObservableCollection<T> implements IObservableCollection<T> {
  protected _items: T[];
  protected _items$: BehaviorSubject<T[]>;
  readonly items$: Observable<T[]>;
  protected _itemAdded$: Subject<T>;
  readonly itemAdded$: Observable<T>;
  protected _itemRemoved$: Subject<T>;
  readonly itemRemoved$: Observable<T>;
  protected _itemUpdated$: Subject<{
    oldItem: T;
    newItem: T;
  }>;
  readonly itemUpdated$: Observable<{
    oldItem: T;
    newItem: T;
  }>;
  constructor(initialItems?: T[]);
  /**
   * Adds an item to the collection.
   * @param item The item to add.
   */
  add(item: T): void;
  /**
   * Removes items from the collection based on a predicate.
   * @param predicate A function that returns true for items to be removed.
   */
  remove(predicate: (item: T) => boolean): void;
  /**
   * Updates an item in the collection based on a predicate.
   * Emits `itemUpdated$` if an item is found and updated.
   * Note: This assumes `newItem` will replace the existing item, and you might need an ID-based comparison
   * or a deep merge depending on your specific update logic.
   * @param predicate A function that returns true for the item to be updated.
   * @param newItem The new item data.
   */
  update(predicate: (item: T) => boolean, newItem: T): void;
  /**
   * Clears all items from the collection.
   */
  clear(): void;
  /**
   * Replaces all current items in the collection with a new set of items.
   * @param newItems The new array of items.
   */
  setItems(newItems: T[]): void;
  /**
   * Returns a shallow copy of the internal items array.
   */
  toArray(): T[];
  /**
   * Gets the current number of items in the collection.
   */
  get length(): number;
}
//# sourceMappingURL=ObservableCollection.d.ts.map
