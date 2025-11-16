/**
 * @web-loom/ui-core
 * 
 * Framework-agnostic headless UI behaviors for modern web applications.
 * 
 * This package provides atomic UI interaction behaviors that can be used
 * across different frameworks (React, Vue, Angular) or with vanilla JavaScript.
 * All behaviors are built on top of @web-loom/store-core for state management.
 */

// Behaviors
export * from './behaviors';

// Framework adapters
export * from './adapters/react';
// export * from './adapters/vue';
// export * from './adapters/angular';

// Types will be exported here as they are implemented
// export * from './types';

export const version = '1.0.0';
