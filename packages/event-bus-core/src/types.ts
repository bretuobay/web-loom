/**
 * Maps event names to their corresponding payload types.
 * For example: `{ 'user:created': { id: string, name: string }, 'app:loaded': void }`
 */
export type EventMap = Record<string, any[] | undefined>;

/**
 * Represents a generic listener function for any event.
 * Args are passed as a rest parameter array.
 */
export type GenericListener = (...args: any[]) => void;

/**
 * Represents a typed listener function for a specific event.
 * @template K The event name.
 * @template M The EventMap.
 */
export type Listener<K extends keyof M, M extends EventMap> = (...args: M[K] extends any[] ? M[K] : []) => void;

/**
 * The core EventBus interface.
 * @template M The EventMap defining event names and their payload types.
 */
export interface EventBus<M extends EventMap> {
  /**
   * Registers one or more listener functions for a given event name.
   * @param event The event name(s) to listen for. Can be a single string or an array of strings.
   * @param listener The callback function to be invoked when the event is emitted.
   */
  on<K extends keyof M>(event: K | K[], listener: Listener<K, M>): void;

  /**
   * Registers a listener function that is invoked at most once for a given event name.
   * @param event The event name to listen for.
   * @param listener The callback function to be invoked once when the event is emitted.
   */
  once<K extends keyof M>(event: K, listener: Listener<K, M>): void;

  /**
   * Unregisters specific listener functions from an event name, or all listeners.
   * @param event The event name to unregister from. If undefined, unregisters from all events.
   * @param listener The specific listener function to unregister. If undefined, all listeners for the event are removed.
   */
  off<K extends keyof M>(event?: K, listener?: Listener<K, M>): void;
  off(event?: keyof M, listener?: GenericListener): void; // Overload for generic use

  /**
   * Emits an event, invoking all registered listener functions for that event name.
   * @param event The event name to emit.
   * @param args The payload arguments to pass to the listeners.
   */
  emit<K extends keyof M>(event: K, ...args: M[K] extends any[] ? M[K] : []): void;
  emit(event: string, ...args: any[]): void; // Overload for generic use
}

/**
 * The function to create a new EventBus instance.
 * @template M The EventMap defining event names and their payload types.
 * @returns A new EventBus instance.
 */
