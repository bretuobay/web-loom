Product Requirements Document: Framework-Agnostic Event Bus Library
1. Introduction
1.1 Purpose
This Product Requirements Document (PRD) outlines the requirements for a lightweight, framework-agnostic Event Bus library written in TypeScript. This library will serve as a central communication mechanism, complementing existing client-state and server-state management solutions by enabling decoupled component and module interactions through a publish-subscribe pattern.
1.2 Scope
The scope of this document covers the core functionalities necessary for a robust Event Bus, including event registration (on), event unregistration (off), single-shot event listening (once), and event emission (emit). It also defines the technical requirements, including the use of TypeScript for type-safety and Vitest for testing. This document is designed to be comprehensive enough for an AI/Large Language Model agent to translate into a concrete implementation with accompanying tests.
1.3 Goals
Provide a simple, intuitive API for event-driven communication.
Ensure full type-safety through TypeScript for event names and payload types.
Be completely framework-agnostic, usable with React, Vue, Angular, Svelte, or vanilla JavaScript.
Maintain a small bundle size and high performance.
Facilitate decoupled architecture by enabling components to communicate without direct dependencies.
2. Product Overview
The Event Bus library will offer a central instance that allows different parts of an application to communicate by emitting and subscribing to custom events. It will act as a global or scoped message broker, where publishers can send messages (events) to specific channels (event names) and subscribers can listen for these messages without knowing who sent them. This pattern is crucial for building scalable and maintainable applications.
2.1 Key Concepts
Event Bus Instance: The central object responsible for managing event registrations and emissions.
Event Name: A string or symbol identifier for a specific type of event.
Listener/Handler: A callback function that is executed when a specific event is emitted.
Payload: Data associated with an event, passed to the listener when the event is emitted.
3. Functional Requirements
3.1 Core Functionality
FR.1: Event Registration (on)
The Event Bus shall provide an on method to register one or more listener functions for a given event name.
It should support registering multiple listeners for the same event.
It should support registering a single listener for multiple specified events.
FR.2: Event Unregistration (off)
The Event Bus shall provide an off method to unregister specific listener functions from an event name.
It should support unregistering a specific listener for a specific event.
It should support unregistering all listeners for a specific event if no listener is provided.
It should support unregistering all listeners for all events if no arguments are provided.
FR.3: Single-Shot Event Registration (once)
The Event Bus shall provide a once method to register a listener function that is invoked at most once for a given event name. After being invoked, or if the event is removed, the listener should be automatically unregistered.
FR.4: Event Emission (emit)
The Event Bus shall provide an emit method to trigger all registered listener functions for a given event name, passing any provided payload arguments to them.
It should support emitting events with zero or more arguments (payload).
Listeners should be called synchronously in the order they were registered.
FR.5: Listener Management
The Event Bus shall maintain an internal collection of event names mapped to their respective listener functions.
3.2 API Design (TypeScript Interfaces)
The core API will revolve around the EventBus interface and its methods. The design should allow for strong typing of event names and their corresponding payload types.
// types.ts

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
export declare function createEventBus<M extends EventMap>(): EventBus<M>;


4. Non-Functional Requirements
4.1 Technology Stack
Language: TypeScript (strict mode enabled).
Runtime Environment: Modern JavaScript environments (ES2018+).
4.2 Testing
Testing Framework: Vitest.
Test Coverage: High test coverage for all core functionalities.
Types: Type definitions must be correct and provide strong type inference for event names and payloads.
4.3 Performance
Minimal overhead for event registration, unregistration, and emission.
Efficient lookup of listeners for emitted events.
4.4 Usability / Developer Experience (DX)
Clear, concise, and intuitive API.
Comprehensive TypeScript types for auto-completion and compile-time error checking, especially for event names and payloads.
Easy to integrate into any frontend framework or vanilla JavaScript project.
4.5 Bundle Size
The library should be lightweight with a minimal footprint. Avoid unnecessary dependencies.
5. Technical Design (High-Level Principles)
Observer Pattern: The core of the Event Bus will be implemented using the Observer pattern, where the Event Bus acts as the "subject" and listeners are "observers."
Internal Map: A Map or plain object will be used internally to store event names as keys and arrays of listener functions as values.
No External Dependencies: The library should have zero external runtime dependencies beyond what's provided by the JavaScript environment and TypeScript compilation.
Synchronous Execution: All listeners for an emit call should be executed synchronously.
6. Test Cases
The following test cases, written using Vitest, should be implemented to ensure the correctness and robustness of the Event Bus library.
6.1 Basic Event Registration and Emission
TC.1.1: Single Listener, Single Event:
Description: Verify that a single listener is called when its corresponding event is emitted.
Expected Outcome: Listener is called exactly once with the correct payload.
TC.1.2: Multiple Listeners, Single Event:
Description: Verify that all registered listeners for an event are called when the event is emitted.
Expected Outcome: All listeners are called, each exactly once, with the correct payload.
TC.1.3: Listener with No Payload:
Description: Verify that a listener is called correctly when an event is emitted without a payload.
Expected Outcome: Listener is called with no arguments.
TC.1.4: Listener with Multiple Payload Arguments:
Description: Verify that a listener receives multiple payload arguments correctly.
Expected Outcome: Listener is called with all provided arguments in the correct order.
TC.1.5: Registering Listener for Multiple Events:
Description: Verify that a single listener can be registered for and respond to multiple distinct events.
Expected Outcome: The listener is called when either of the registered events is emitted.
6.2 Event Unregistration (off)
TC.2.1: Unregister Specific Listener:
Description: Verify that a specific listener can be unregistered and is no longer called after off.
Expected Outcome: The unregistered listener is not called, while other active listeners for the same event still are.
TC.2.2: Unregister All Listeners for an Event:
Description: Verify that all listeners for a specific event are removed when off(eventName) is called.
Expected Outcome: No listeners are called when that event is subsequently emitted.
TC.2.3: Unregister All Listeners (Global):
Description: Verify that all listeners across all events are removed when off() is called without arguments.
Expected Outcome: No listeners are called for any event after off() is called.
TC.2.4: Calling off for Non-Existent Listener/Event:
Description: Verify that calling off with a non-existent listener or event does not cause errors and leaves existing listeners intact.
Expected Outcome: No errors, and existing listeners continue to function normally.
6.3 Single-Shot Events (once)
TC.3.1: Single-Shot Listener Invocation:
Description: Verify that a once listener is called exactly once upon the first emission of its event and then automatically unregistered.
Expected Outcome: Listener is called on the first emit, but not on subsequent emits.
TC.3.2: once Listener with Payload:
Description: Verify once listener correctly receives payload.
Expected Outcome: Listener is called with the correct payload on its single invocation.
TC.3.3: Multiple once Listeners:
Description: Verify multiple once listeners for the same event are all called once and then removed.
Expected Outcome: All once listeners are called once and then none are called on subsequent emits.
6.4 Edge Cases and Robustness
TC.4.1: Listener Called from Within Another Listener:
Description: Verify that the order of execution is maintained if a listener emits another event.
Expected Outcome: All listeners for the first event are called, then listeners for the second event are called.
TC.4.2: Unsubscribe within Listener:
Description: Verify that calling off from within a listener does not disrupt the ongoing emission cycle for other listeners.
Expected Outcome: The listener that called off is removed, but subsequent listeners in the current emission cycle are still called.
TC.4.3: Empty Event Name/Payload:
Description: Test behavior when emitting events with empty strings or invalid types as event names (should likely throw or be ignored depending on strictness).
Expected Outcome: The library should handle these cases gracefully (e.g., ignore if not a valid string or symbol, or throw a clear error). Initial implementation can be lenient, strictness can be added later.
TC.4.4: Type Safety (Compile-time check, not runtime test):
Description: Verify that TypeScript correctly enforces payload types for on, once, and emit based on the EventMap. This is a compile-time check primarily, but examples in tests can demonstrate it.
Expected Outcome: Incorrect payload types or event names result in TypeScript errors.
7. Future Considerations (Out of Scope for Initial Version)
Wildcard Events: Support for listening to all events or events matching a pattern (e.g., event:*).
Async Listeners: Mechanisms for handling asynchronous listener execution, potentially with promises.
Error Handling in Listeners: A way to catch and handle errors thrown by listener functions without breaking the entire emission chain.
Prioritization of Listeners: Ability to define an order for listener execution.
Event History/Debugging: Optional features to log emitted events for debugging purposes.
