/**
 * Match a key against a pattern (supports wildcards)
 */
export function matchPattern(key: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (!pattern.includes('*')) return key === pattern;

  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  return regex.test(key);
}
