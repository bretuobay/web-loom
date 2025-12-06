// Context management
export { ContextManager } from './ContextManager';

// Built-in context providers
export {
  BrowserContextProvider,
  NodeContextProvider,
  ApplicationContextProvider,
  RequestContextProvider,
  UserContextProvider,
  SessionContextProvider,
  PerformanceContextProvider,
  CustomContextProvider,
} from './BuiltInProviders';

// Re-export context provider type
export type { ContextProvider } from '../types/config.types';
