import type { ReactNode } from 'react';

type ClassValue =
  | string
  | undefined
  | null
  | false
  | { [key: string]: boolean | string | number | undefined | null | ReactNode };

/**
 * Lightweight classnames helper to avoid pulling in an extra dependency.
 * Supports strings, objects with boolean values, and arrays.
 * Falsy values are filtered to keep the string clean.
 */
export function cn(...values: ClassValue[]): string {
  const classes: string[] = [];

  for (const value of values) {
    if (!value) continue;

    if (typeof value === 'string') {
      classes.push(value);
    } else if (typeof value === 'object') {
      for (const [key, val] of Object.entries(value)) {
        if (val) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}
