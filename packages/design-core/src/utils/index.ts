// packages/design-core/src/utils/index.ts

// Export types from tokens.d.ts
export * from './tokens.d';

// Export functions and types from tokens.ts
export { getAllTokens, getTokenValue } from './tokens';

// Export functions from cssVariables.ts
export {
  pathToCssVar,
  getTokenVar,
  getSafeTokenVar, // Renamed from getResolvedTokenVar
  generateCssVariablesMap,
  generateCssVariablesString,
} from './cssVariables';

// Export functions and types from theme.ts
// Explicitly export named functions and the Theme interface.
export { createTheme, applyTheme, setTheme, getCurrentTheme } from './theme';
export type { Theme } from './theme';

// This index file serves as the public API for the utilities directory.
// Consumers of the @design-core/utils package (or internal consumers)
// can import these utilities from a single entry point:
//
// Example:
// import { getTokenValue, generateCssVariablesString, setTheme, Theme } from '@design-core/utils';
// or from relative paths if used internally:
// import { getTokenValue } from '../utils';
