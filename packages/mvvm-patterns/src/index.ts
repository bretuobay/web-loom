/**
 * @packageDocumentation
 * Application-level MVVM patterns for Web Loom
 *
 * This package provides patterns for:
 * - ViewModel-to-View communication (InteractionRequest)
 * - Active/Inactive state tracking (ActiveAware)
 * - View lifetime management (IViewLifetime)
 */

// Interaction Request Pattern
export * from './interactions';

// Active Aware Pattern
export { ActiveAwareViewModel } from './viewmodels/ActiveAwareViewModel';
export type { IActiveAware } from './lifecycle/IActiveAware';
export { isActiveAware } from './lifecycle/IActiveAware';

// Lifecycle exports
export * from './lifecycle';
export * from './viewmodels';

// Version
export const VERSION = '0.0.1';
