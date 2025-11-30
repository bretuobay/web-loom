/**
 * Utilities for working with dot-notation paths in nested objects
 */

/**
 * Get nested value using dot notation path
 * @param obj - The object to traverse
 * @param path - Dot notation path (e.g., 'user.address.street')
 * @returns The value at the path, or undefined if not found
 */
export function getPath(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current !== 'object') {
      return undefined;
    }

    // Handle array indices
    if (Array.isArray(current) && /^\d+$/.test(key)) {
      const index = parseInt(key, 10);
      current = current[index];
    } else {
      if (current && typeof current === 'object' && key in current) {
        const next = (current as Record<string, unknown>)[key];
        current = next;
      } else {
        return undefined;
      }
    }
  }

  return current;
}

/**
 * Set nested value using dot notation path
 * @param obj - The object to modify (will be mutated)
 * @param path - Dot notation path (e.g., 'user.address.street')
 * @param value - The value to set
 */
export function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current = obj;

  // Navigate to the parent of the target
  for (const key of keys) {
    // Handle array indices
    if (Array.isArray(current) && /^\d+$/.test(key)) {
      const index = parseInt(key, 10);
      if (!current[index] || typeof current[index] !== 'object') {
        current[index] = {};
      }
      current = current[index] as Record<string, unknown>;
    } else {
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        // Check if next key is a number to determine if we should create an array
        const nextKeyIndex = keys.indexOf(key) + 1;
        const nextKey = keys[nextKeyIndex];
        current[key] = nextKey && /^\d+$/.test(nextKey) ? [] : {};
      }
      current = current[key] as Record<string, unknown>;
    }
  }

  // Set the final value
  if (Array.isArray(current) && /^\d+$/.test(lastKey)) {
    const index = parseInt(lastKey, 10);
    current[index] = value;
  } else {
    current[lastKey] = value;
  }
}

/**
 * Delete a nested property using dot notation path
 * @param obj - The object to modify
 * @param path - Dot notation path
 * @returns true if the property was deleted, false if it didn't exist
 */
export function deletePath(obj: Record<string, unknown>, path: string): boolean {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current = obj;

  // Navigate to the parent of the target
  for (const key of keys) {
    if (!current || typeof current !== 'object') {
      return false;
    }

    if (Array.isArray(current) && /^\d+$/.test(key)) {
      const index = parseInt(key, 10);
      current = current[index] as Record<string, unknown>;
    } else {
      current = current[key] as Record<string, unknown>;
    }
  }

  if (!current || typeof current !== 'object') {
    return false;
  }

  // Delete the final property
  if (Array.isArray(current) && /^\d+$/.test(lastKey)) {
    const index = parseInt(lastKey, 10);
    if (index < current.length) {
      current.splice(index, 1);
      return true;
    }
  } else if (lastKey in current) {
    delete current[lastKey];
    return true;
  }

  return false;
}

/**
 * Check if a path exists in an object
 * @param obj - The object to check
 * @param path - Dot notation path
 * @returns true if the path exists
 */
export function hasPath(obj: unknown, path: string): boolean {
  return getPath(obj, path) !== undefined;
}

/**
 * Get all paths in an object (flattened)
 * @param obj - The object to traverse
 * @param prefix - Internal prefix for recursion
 * @returns Array of all dot notation paths
 */
export function getAllPaths(obj: unknown, prefix = ''): string[] {
  const paths: string[] = [];

  if (!obj || typeof obj !== 'object') {
    return paths;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const currentPath = prefix ? `${prefix}.${index}` : String(index);
      paths.push(currentPath);

      if (item && typeof item === 'object') {
        paths.push(...getAllPaths(item, currentPath));
      }
    });
  } else {
    const record = obj as Record<string, unknown>;
    Object.keys(record).forEach((key) => {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      paths.push(currentPath);

      if (record[key] && typeof record[key] === 'object') {
        paths.push(...getAllPaths(record[key], currentPath));
      }
    });
  }

  return paths;
}

/**
 * Normalize path by removing empty segments and handling edge cases
 * @param path - The path to normalize
 * @returns Normalized path
 */
export function normalizePath(path: string): string {
  return path
    .split('.')
    .filter((segment) => segment.length > 0)
    .join('.');
}

/**
 * Get parent path from a given path
 * @param path - The path
 * @returns Parent path or empty string if no parent
 */
export function getParentPath(path: string): string {
  const segments = path.split('.');
  segments.pop();
  return segments.join('.');
}

/**
 * Get field name from a path (last segment)
 * @param path - The path
 * @returns Field name
 */
export function getFieldName(path: string): string {
  const segments = path.split('.');
  return segments[segments.length - 1] || '';
}

/**
 * Check if one path is a child of another
 * @param parentPath - The potential parent path
 * @param childPath - The potential child path
 * @returns true if childPath is under parentPath
 */
export function isChildPath(parentPath: string, childPath: string): boolean {
  if (parentPath === childPath) {
    return false;
  }
  return childPath.startsWith(parentPath + '.');
}
