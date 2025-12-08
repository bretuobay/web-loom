type ClassValue = string | undefined | null | false;

/**
 * Lightweight classnames helper to avoid pulling in an extra dependency.
 * Falsy values are filtered to keep the string clean.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}

