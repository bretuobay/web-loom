import { describe, expect, it, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
import { templateCoreLoom } from './loom-plugin.js';
import { loomVirtualId } from './loom/constants.js';
import type { Plugin } from 'vite';

function makeContext() {
  return {
    error(message: string): never {
      throw new Error(message);
    },
  };
}

function runLoad(plugin: Plugin, id: string, command: 'build' | 'serve' = 'build') {
  (plugin.configResolved as (config: { command: string }) => void)?.({ command });
  const load = plugin.load as (this: ReturnType<typeof makeContext>, id: string) => string | null;
  return load.call(makeContext(), id);
}

const fixturePath = fileURLToPath(new URL('./__fixtures__/loom-app/greeting.loom', import.meta.url));

describe('templateCoreLoom plugin', () => {
  it('resolveId maps .loom imports to a virtual id', () => {
    const plugin = templateCoreLoom();
    const importer = '/app/src/page.ts';
    const resolved = (plugin.resolveId as Function)('./header.loom', importer);
    expect(resolved).toBe(loomVirtualId('/app/src/header.loom'));
  });

  it('load emits fromPrecompiled during build', () => {
    const plugin = templateCoreLoom();
    const code = runLoad(plugin, loomVirtualId(fixturePath), 'build');
    expect(code).toContain('fromPrecompiled(');
    expect(code).not.toContain('compile(');
  });

  it('load emits compile() during serve', () => {
    const plugin = templateCoreLoom();
    const code = runLoad(plugin, loomVirtualId(fixturePath), 'serve');
    expect(code).toContain('compile(');
    expect(code).toContain('import.meta.hot.accept()');
    expect(code).not.toContain('fromPrecompiled(');
  });

  it('handleHotUpdate invalidates the virtual module for .loom files', () => {
    const plugin = templateCoreLoom();
    const file = '/app/header.loom';
    const virtualId = loomVirtualId(file);
    const module = { id: virtualId };
    const invalidateModule = vi.fn();
    const getModuleById = vi.fn(() => module);
    const result = (plugin.handleHotUpdate as Function)({
      file,
      server: { moduleGraph: { getModuleById, invalidateModule } },
    });

    expect(getModuleById).toHaveBeenCalledWith(virtualId);
    expect(invalidateModule).toHaveBeenCalledWith(module);
    expect(result).toEqual([module]);
  });
});
