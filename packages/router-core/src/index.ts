export { createRouter } from './router';
export { matchRoute } from './matcher';
export { parseQuery, stringifyQuery, buildURL } from './query';
export type {
  RouteDefinition,
  NavigationGuard,
  NavigationLocation,
  NavigationTarget,
  RouteMatch,
  Router,
  RouterOptions,
  RedirectObject,
  RouterMode,
  AfterNavigationHook,
} from './types';
