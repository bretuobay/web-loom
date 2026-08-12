import { readFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, resolve as resolvePath } from 'node:path';
import type { Plugin } from 'vite';
import {
  DEFAULT_LOOM_SPECIFIER,
  DEFAULT_SSR_LOOM_SPECIFIER,
  isLoomImportId,
  loomFilePathFromVirtualId,
  loomVirtualId,
  type LoomEmitMetadata,
} from './loom/constants.js';
import { emitLoomBuildModule } from './loom/emit-build.js';
import { emitLoomDevModule } from './loom/emit-dev.js';

export interface TemplateCoreLoomPluginOptions {
  /**
   * Module specifier for `compile` / `fromPrecompiled`. Default:
   * `@web-loom/template-core` (browser/client). Set `ssr: true` for the SSR entry.
   */
  specifier?: string;
  /** When true, import from `@web-loom/template-core/ssr` instead of the browser entry. */
  ssr?: boolean;
}

function resolveLoomFilePath(id: string, importer?: string): string | null {
  if (id.startsWith('\0')) {
    return loomFilePathFromVirtualId(id);
  }
  if (!id.endsWith('.loom')) return null;
  if (isAbsolute(id)) return id;
  if (!importer) return null;
  return resolvePath(dirname(importer), id);
}

function metadataFor(filePath: string, specifier: string): LoomEmitMetadata {
  return {
    name: basename(filePath, '.loom'),
    sourcePath: filePath,
    specifier,
  };
}

/**
 * Vite plugin for `.loom` template files (Phase 5-b).
 *
 * - **`vite dev`:** emits a module calling runtime `compile(source, { name, sourcePath })`.
 * - **`vite build`:** emits `fromPrecompiled(plan)` via `precompileNode()`.
 *
 * Grammar and diagnostics reuse the same compiler APIs as string-based templates.
 */
export function templateCoreLoom(options: TemplateCoreLoomPluginOptions = {}): Plugin {
  const specifier =
    options.specifier ?? (options.ssr ? DEFAULT_SSR_LOOM_SPECIFIER : DEFAULT_LOOM_SPECIFIER);

  let buildMode = false;

  return {
    name: 'template-core-loom',
    enforce: 'pre',

    configResolved(config) {
      buildMode = config.command === 'build';
    },

    resolveId(source, importer) {
      if (!source.endsWith('.loom')) return null;
      const filePath = resolveLoomFilePath(source, importer ?? undefined);
      if (!filePath) return null;
      return loomVirtualId(filePath);
    },

    load(id) {
      const filePath = loomFilePathFromVirtualId(id);
      if (!filePath) return null;

      let source: string;
      try {
        source = readFileSync(filePath, 'utf8');
      } catch (error) {
        this.error(
          `template-core-loom: failed to read ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      const meta = metadataFor(filePath, specifier);

      try {
        return buildMode ? emitLoomBuildModule(source, meta) : emitLoomDevModule(source, meta);
      } catch (error) {
        this.error(
          `template-core-loom: failed to compile ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },

    handleHotUpdate({ file, server }) {
      if (!file.endsWith('.loom')) return;
      const virtualId = loomVirtualId(file);
      const module = server.moduleGraph.getModuleById(virtualId);
      if (!module) return;
      server.moduleGraph.invalidateModule(module);
      return [module];
    },
  };
}

export { isLoomImportId };
