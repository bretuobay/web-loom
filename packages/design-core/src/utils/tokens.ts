// packages/design-core/src/utils/tokens.ts
import type { DesignTokens, TokenValue, TokenCategory, TokenGroup } from './tokens.d';

/**
 * List of token JSON files to be loaded.
 * Assumes these files are located in `../tokens/` relative to this utility.
 * This path is used in dynamic imports, so it's crucial for the build/runtime environment.
 */
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

// Internal cache for fully processed tokens.
const masterTokens: DesignTokens = {};
let masterTokensInitialized = false;

/**
 * Internal helper: Extracts the 'value' from token objects (e.g., { value: "..." }).
 * If the node is already a primitive or a nested object without 'value', it's returned as is.
 * @param node The token node to process.
 * @returns The processed token value or structure.
 */
function processTokenNode(node: any): TokenValue | TokenGroup | TokenCategory {
  if (typeof node === 'object' && node !== null) {
    if ('value' in node) {
      return node.value;
    }
    const processedNode: TokenGroup | TokenCategory = {};
    for (const key in node) {
      processedNode[key] = processTokenNode(node[key]) as TokenValue | TokenGroup;
    }
    return processedNode;
  }
  return node as TokenValue;
}

/**
 * Internal helper: Recursively walks through the token structure to find and resolve references.
 * A reference looks like "{category.path.to.token.value}".
 * @param obj The current token object/group to traverse.
 * @param callback The function to call for each non-object value found.
 * @param currentPath The path accumulated so far during traversal.
 */
function walkTokens(
  obj: DesignTokens | TokenCategory | TokenGroup,
  callback: (value: TokenValue, path: string[]) => void,
  currentPath: string[] = [],
): void {
  for (const key in obj) {
    const value = (obj as any)[key];
    const newPath = currentPath.concat(key);
    if (typeof value === 'object' && value !== null) {
      walkTokens(value, callback, newPath);
    } else {
      callback(value as TokenValue, newPath);
    }
  }
}

/**
 * Internal helper: Resolves token references within the token object.
 * References are strings like "{colors.base.primary.value}".
 * @param tokens The DesignTokens object to resolve references in (mutated directly).
 * exported for use in tests or other utilities.
 */
export function resolveTokenReferences(tokens: DesignTokens): void {
  const referenceRegex = /^{([^}]+)\.value}$/; // Matches {path.to.token.value}

  const getReferencedValue = (path: string, allTokens: DesignTokens): TokenValue | undefined => {
    const parts = path.split('.');
    let current: any = allTokens;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined; // Path not found
      }
    }
    // After processing by processTokenNode, 'current' should be the direct value.
    return current as TokenValue;
  };

  walkTokens(tokens, (value, pathArray) => {
    if (typeof value === 'string') {
      const match = value.match(referenceRegex);
      if (match) {
        const referencePath = match[1];
        const resolvedValue = getReferencedValue(referencePath, tokens);
        if (resolvedValue !== undefined) {
          // Update the value in the masterTokens object by path
          let parent: any = tokens;
          for (let i = 0; i < pathArray.length - 1; i++) {
            parent = parent[pathArray[i]];
          }
          parent[pathArray[pathArray.length - 1]] = resolvedValue;
        } else {
          console.warn(`Token reference "${value}" at path "${pathArray.join('.')}" could not be resolved.`);
        }
      }
    }
  });
}

/**
 * Initializes the masterTokens object by loading, processing, and resolving all token files.
 * This function is called once when tokens are first requested.
 * Note: Dynamic imports `import()` are used here. Ensure your environment (Node.js with flags,
 * or a bundler like Vite/Webpack) supports them and can resolve `../tokens/${fileName}`.
 * For Node.js, `resolveJsonModule` and `esModuleInterop` should be true in `tsconfig.json`.
 */
async function initializeMasterTokens(): Promise<void> {
  if (masterTokensInitialized) {
    return;
  }

  const rawTokens: DesignTokens = {};
  for (const fileName of tokenFiles) {
    const categoryName = fileName.replace('.json', '');
    try {
      // Dynamically import JSON token files.
      const tokenModule = await import(`../tokens/${fileName}`);
      rawTokens[categoryName] = tokenModule.default || tokenModule;
    } catch (error) {
      console.error(
        `Error loading token file ${fileName}. Ensure it exists at '../tokens/${fileName}' and is valid JSON.`,
        error,
      );
      rawTokens[categoryName] = {}; // Fallback to empty object for this category
    }
  }

  // First pass: extract '.value' properties from token objects.
  for (const category in rawTokens) {
    masterTokens[category] = processTokenNode(rawTokens[category]) as TokenCategory;
  }

  // Second pass: resolve references (e.g., "{colors.base.primary.value}")
  resolveTokenReferences(masterTokens);

  masterTokensInitialized = true;
}

/**
 * Retrieves all loaded and processed design tokens.
 * Tokens are loaded and processed on the first call, then cached.
 *
 * @returns A promise that resolves to the fully processed DesignTokens object.
 * @example
 * async function logTokens() {
 *   const tokens = await getAllTokens();
 *   console.log(tokens.colors.base.primary); // e.g., "#1E40AF"
 * }
 */
export async function getAllTokens(): Promise<DesignTokens> {
  if (!masterTokensInitialized) {
    await initializeMasterTokens();
  }
  return masterTokens;
}

/**
 * Retrieves a specific token value using a path string (e.g., "colors.base.primary").
 * Ensures that tokens are loaded and references are resolved before returning a value.
 *
 * @param path The dot-separated path to the token (e.g., "colors.base.primary").
 * @returns A promise that resolves to the TokenValue or undefined if the path is not found.
 * @example
 * async function logTokenValue() {
 *   const primaryColor = await getTokenValue('colors.base.primary');
 *   if (primaryColor) {
 *     console.log(primaryColor); // e.g., "#1E40AF"
 *   }
 *
 *   const lightBg = await getTokenValue('colors.themed.light.background');
 *   console.log(lightBg); // e.g., "#FFFFFF" (after reference resolution)
 * }
 */
export async function getTokenValue(path: string): Promise<TokenValue | undefined> {
  if (!masterTokensInitialized) {
    await initializeMasterTokens();
  }
  const parts = path.split('.');
  let current: any = masterTokens;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      console.warn(`Token path "${path}" not found in processed tokens.`);
      return undefined;
    }
  }
  // 'current' should now be the fully resolved, primitive token value.
  return current as TokenValue;
}

// Example usage comments (can be removed if adding to actual documentation/README):
//
// async function exampleUsage() {
//   try {
//     const tokens = await getAllTokens();
//     console.log('All Tokens:', JSON.stringify(tokens, null, 2));
//
//     const primaryColor = await getTokenValue('colors.base.primary');
//     console.log('Primary Color:', primaryColor); // Expected: "#1E40AF"
//
//     const lightBg = await getTokenValue('colors.themed.light.background');
//     console.log('Light Theme Background:', lightBg); // Expected: "#FFFFFF" (after resolving reference)
//
//     const spacingGutter = await getTokenValue('spacing.gutter');
//     console.log('Spacing Gutter:', spacingGutter); // Expected: "16px" (after resolving reference)
//
//     const nonExistent = await getTokenValue('colors.nonexistent.token');
//     console.log('Non Existent Token:', nonExistent); // Expected: undefined
//   } catch (error) {
//     console.error("Error in token usage example:", error);
//   }
// }
//
// if (typeof window !== 'undefined') { // Basic check to run example in browser-like env
//   // exampleUsage();
// }
