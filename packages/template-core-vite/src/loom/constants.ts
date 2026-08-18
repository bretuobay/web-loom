export const LOOM_VIRTUAL_PREFIX = '\0template-core-loom:';

export const DEFAULT_LOOM_SPECIFIER = '@web-loom/template-core';

export const DEFAULT_SSR_LOOM_SPECIFIER = '@web-loom/template-core/ssr';

export interface LoomEmitMetadata {
  /** Basename without `.loom` — used as the compile/precompile `name`. */
  name: string;
  /** Absolute path to the `.loom` file (diagnostics + source maps). */
  sourcePath: string;
  /** Import specifier for `compile` / `fromPrecompiled`. */
  specifier: string;
}

export function loomVirtualId(filePath: string): string {
  return `${LOOM_VIRTUAL_PREFIX}${filePath}`;
}

export function loomFilePathFromVirtualId(id: string): string | null {
  if (!id.startsWith(LOOM_VIRTUAL_PREFIX)) return null;
  return id.slice(LOOM_VIRTUAL_PREFIX.length);
}

export function isLoomImportId(id: string): boolean {
  return id.endsWith('.loom') || id.startsWith(LOOM_VIRTUAL_PREFIX);
}
