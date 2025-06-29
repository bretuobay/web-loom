// packages/design-core/src/utils/tokens.ts
import { DesignTokens, TokenValue, TokenCategory, TokenGroup } from './tokens.d';

// Node.js built-in modules for file system access.
// We'll need to adjust this if running in a browser environment directly,
// but for a build process or server-side utility, this is fine.
// For now, we'll define a placeholder and assume tokens are loaded elsewhere.
// In a real scenario, this would involve fs.readdirSync and fs.readFileSync.

// Placeholder for the actual token loading mechanism.
// In a real build system (e.g., using Vite, Webpack, or a custom script),
// you might use import assertions for JSON or a dynamic import.
// For now, we'll simulate this by manually listing the expected token files
// and expect them to be provided or loaded by a separate mechanism.

// Simulating the structure of token files found.
// In a real scenario, you would dynamically list files from packages/design-core/src/tokens
const tokenFiles = [
  'borders.json',
  'breakpoints.json',
  'colors.json',
  'cursor-styles.json',
  'focus-rings.json',
  'gradients.json',
  'opacity.json',
  'radii.json',
  'shadows.json',
  'sizing.json',
  'spacing.json',
  'timing.json',
  'transitions.json',
  'typography.json',
  'z-index.json',
];

// This object will hold all our design tokens, loaded and processed.
// We are declaring it but not yet populating it from actual files in this snippet.
// The actual loading would happen in a Node.js environment or via bundler features.
const ALL_TOKENS: DesignTokens = {};

// --- Helper function to process raw token objects ---
// This function extracts the 'value' field from token objects.
// If a token object has { value: "...", type: "..." }, it returns "..."
// Otherwise, if it's already a primitive or a nested object without 'value', it returns it as is.
function processTokenNode(node: any): TokenValue | TokenGroup | TokenCategory {
  if (typeof node === 'object' && node !== null) {
    if ('value' in node) {
      return node.value; // Extract the value
    }
    // If no 'value' key, recursively process nested objects
    const processedNode: TokenGroup | TokenCategory = {};
    for (const key in node) {
      processedNode[key] = processTokenNode(node[key]) as TokenValue | TokenGroup;
    }
    return processedNode;
  }
  return node as TokenValue; // Return primitive value as is
}


// --- Function to load and process tokens ---
// This is a conceptual function. Actual file reading needs a Node.js environment.
// For now, it will log that it needs to be implemented.
// In a real app, this would be part of your build process or server startup.
async function loadAndProcessTokens(): Promise<DesignTokens> {
  const loadedTokens: DesignTokens = {};

  // --- Placeholder for actual file reading ---
  // Replace this with actual file system reading logic if in Node.js
  // For example, using dynamic imports or fs.readFile
  // console.warn("Token loading from file system is not implemented in this environment.");
  // Example: loadedTokens['colors'] = await import('../tokens/colors.json').then(m => m.default);

  // For now, we'll assume tokens are pre-loaded or manually added here for demonstration.
  // Example:
  // import colorsData from '../tokens/colors.json';
  // import spacingData from '../tokens/spacing.json';
  // loadedTokens['colors'] = processTokenNode(colorsData) as TokenCategory;
  // loadedTokens['spacing'] = processTokenNode(spacingData) as TokenCategory;
  // ALL_TOKENS.colors = loadedTokens.colors;
  // ALL_TOKENS.spacing = loadedTokens.spacing;
  // --- End of Placeholder ---

  // The user has provided the file list. We need to dynamically import them.
  // This requires the `resolveJsonModule` and `esModuleInterop` in tsconfig.json to be true.
  for (const fileName of tokenFiles) {
    const categoryName = fileName.replace('.json', '');
    try {
      // Dynamic import for JSON modules.
      // Note: The path might need adjustment based on the final directory structure
      // and how the bundler/runtime resolves these paths.
      // This assumes utils/ is at the same level as tokens/ after compilation.
      // Or that the bundler can resolve '../tokens/fileName'.
      const tokenModule = await import(`../tokens/${fileName}`);
      loadedTokens[categoryName] = processTokenNode(tokenModule.default || tokenModule) as TokenCategory;
    } catch (error) {
      console.error(`Error loading token file ${fileName}:`, error);
      // Fallback to an empty object for this category if loading fails
      loadedTokens[categoryName] = {};
    }
  }

  // Assign to the global ALL_TOKENS object so other functions can access it.
  Object.assign(ALL_TOKENS, loadedTokens);
  resolveTokenReferences(ALL_TOKENS); // Resolve references after all tokens are loaded
  return ALL_TOKENS;
}

// --- Function to resolve token references ---
// A reference looks like "{category.path.to.token.value}"
function resolveTokenReferences(tokens: DesignTokens): void {
  const referenceRegex = /^{([^}]+)\.value}$/; // Matches {path.to.token.value}

  function getReferencedValue(path: string, currentTokens: DesignTokens): TokenValue | undefined {
    const parts = path.split('.');
    let current: any = currentTokens;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined; // Path not found
      }
    }
    // If the direct lookup gave an object like { value: "foo" }, return "foo"
    // This shouldn't happen if processTokenNode was used correctly, as it unwraps .value
    // But as a safeguard or if direct values are objects.
    if (typeof current === 'object' && current !== null && 'value' in current) {
        return current.value;
    }
    return current as TokenValue;
  }

  function_walker(tokens, (value, path_array) => {
    if (typeof value === 'string') {
      const match = value.match(referenceRegex);
      if (match) {
        const referencePath = match[1];
        const resolvedValue = getReferencedValue(referencePath, tokens);
        if (resolvedValue !== undefined) {
          // Update the value in the tokens object
          let parent = tokens;
          for (let i = 0; i < path_array.length -1; i++) {
            parent = parent[path_array[i]] as TokenCategory | TokenGroup;
          }
          (parent as any)[path_array[path_array.length -1]] = resolvedValue;
        } else {
          console.warn(`Token reference "${value}" at path "${path_array.join('.')}" could not be resolved.`);
        }
      }
    }
  });
}

// Helper to walk through nested token objects
function function_walker(
    obj: DesignTokens | TokenCategory | TokenGroup,
    callback: (value: TokenValue, path: string[]) => void,
    currentPath: string[] = []
  ) {
  for (const key in obj) {
    const value = (obj as any)[key];
    const newPath = currentPath.concat(key);
    if (typeof value === 'object' && value !== null) {
      function_walker(value, callback, newPath);
    } else {
      callback(value as TokenValue, newPath);
    }
  }
}


// --- Public API ---

/**
 * Retrieves all loaded and processed design tokens.
 * This function ensures that tokens are loaded before being returned.
 *
 * @returns A promise that resolves to the DesignTokens object.
 */
let tokensPromise: Promise<DesignTokens> | null = null;
export async function getAllTokens(): Promise<DesignTokens> {
  if (!tokensPromise) {
    tokensPromise = loadAndProcessTokens();
  }
  return tokensPromise;
}

/**
 * Retrieves a specific token value using a path string (e.g., "colors.primary.main").
 * It ensures that tokens are loaded and references are resolved before returning a value.
 *
 * @param path The path to the token (e.g., "colors.base.primary").
 * @returns A promise that resolves to the TokenValue or undefined if not found.
 */
export async function getTokenValue(path: string): Promise<TokenValue | undefined> {
  const tokens = await getAllTokens(); // Ensures tokens are loaded and processed
  const parts = path.split('.');
  let current: any = tokens;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined; // Path not found
    }
  }

  // After navigating, if current is an object like { value: "resolvedValue" }, return "resolvedValue".
  // This should ideally not happen if processTokenNode and resolveTokenReferences worked correctly,
  // as they should replace these with the direct value.
  // However, this handles cases where a token might be an object itself (not just a primitive value).
  if (typeof current === 'object' && current !== null && 'value' in current) {
    // This case should ideally be handled by processTokenNode or the reference resolver.
    // If we reach here, it implies a raw token object was not fully processed.
    return current.value;
  }

  return current as TokenValue;
}

// Example of how to initialize and use:
// getAllTokens().then(tokens => {
//   console.log('All tokens loaded:', tokens);
//   getTokenValue('colors.themed.light.background').then(value => {
//     console.log('Light theme background:', value); // Expected: "#FFFFFF" (after resolving {color.neutral.white.value})
//   });
//   getTokenValue('spacing.gutter').then(value => {
//     console.log('Gutter spacing:', value); // Expected: "16px" (after resolving {spacing.4.value})
//   });
// });

// Note: For this to work with dynamic imports of JSON in Node.js,
// your tsconfig.json should have:
// {
//   "compilerOptions": {
//     "module": "esnext", // or commonjs if you configure dynamic imports differently
//     "resolveJsonModule": true,
//     "esModuleInterop": true,
//     // ... other options
//   }
// }
// And you might need to run node with --experimental-json-modules flag if using ES modules.
// Or, use a bundler like Webpack/Vite which handles JSON imports seamlessly.
// For CommonJS modules, you could use:
// const tokenData = require(`../tokens/${fileName}`);
// And adjust tsconfig module to "commonjs".
// Given the project structure, ESNext with import assertions or dynamic imports is more modern.
// Let's assume an environment that supports dynamic import of JSON.
// If this code were part of a build step, `fs` module would be more straightforward.
// If it's runtime in browser, tokens should be bundled.
// The current implementation with dynamic `import()` is a flexible approach.

// The `processTokenNode` function is designed to strip the `{value: ..., type: ...}` structure
// and return only the value. The `resolveTokenReferences` then replaces reference strings
// with their actual values. So `getTokenValue` should ultimately return the final, primitive value.
// If `getTokenValue("colors.base.primary")` is called, it should return "#1E40AF".
// If `getTokenValue("colors.themed.light.background")` is called, it should return "#FFFFFF"
// (assuming `color.neutral.white.value` resolves to "#FFFFFF").
// If `getTokenValue("spacing.gutter")` is called, it should return "16px"
// (assuming `spacing.4.value` resolves to "16px").

// Let's refine `loadAndProcessTokens` to ensure `ALL_TOKENS` is populated correctly
// and `resolveTokenReferences` is called on the fully constructed `ALL_TOKENS` object.
// And then `getTokenValue` reads from this processed `ALL_TOKENS`.

// Revised structure for loadAndProcessTokens and getTokenValue:

const masterTokens: DesignTokens = {}; // This will hold the fully processed tokens
let masterTokensInitialized = false;

async function initializeMasterTokens(): Promise<void> {
  if (masterTokensInitialized) {
    return;
  }

  const rawTokens: DesignTokens = {};
  for (const fileName of tokenFiles) {
    const categoryName = fileName.replace('.json', '');
    try {
      const tokenModule = await import(`../tokens/${fileName}`);
      // Directly assign the default export (the JSON object)
      rawTokens[categoryName] = tokenModule.default || tokenModule;
    } catch (error) {
      console.error(`Error loading token file ${fileName}:`, error);
      rawTokens[categoryName] = {};
    }
  }

  // Now, process these raw tokens to extract values and resolve references
  // First pass: extract values (e.g., from { value: "...", type: "..." } to "...")
  for (const category in rawTokens) {
    masterTokens[category] = processTokenNode(rawTokens[category]) as TokenCategory;
  }

  // Second pass: resolve references
  resolveTokenReferences(masterTokens);

  masterTokensInitialized = true;
}

// Revised public API using the masterTokens structure
export async function getAllTokensProcessed(): Promise<DesignTokens> {
  if (!masterTokensInitialized) {
    await initializeMasterTokens();
  }
  return masterTokens;
}

export async function getTokenValueProcessed(path: string): Promise<TokenValue | undefined> {
  if (!masterTokensInitialized) {
    await initializeMasterTokens();
  }
  const parts = path.split('.');
  let current: any = masterTokens;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      console.warn(`Token path "${path}" not found.`);
      return undefined;
    }
  }
  // By this point, 'current' should be the resolved primitive value.
  return current as TokenValue;
}

// Overwrite previous exports with the new processed versions
export { getAllTokensProcessed as getAllTokens, getTokenValueProcessed as getTokenValue };

// To use:
// import { getAllTokens, getTokenValue } from './utils/tokens';
//
// async function main() {
//   const tokens = await getAllTokens();
//   console.log(tokens.colors.base.primary); // Should be "#1E40AF"
//
//   const primaryColor = await getTokenValue('colors.base.primary');
//   console.log(primaryColor); // Should be "#1E40AF"
//
//   const lightBg = await getTokenValue('colors.themed.light.background');
//   console.log(lightBg); // Should be "#FFFFFF"
//
//   const gutter = await getTokenValue('spacing.gutter');
//   console.log(gutter); // Should be "16px"
// }
// main();
