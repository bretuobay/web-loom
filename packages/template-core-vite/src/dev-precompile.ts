import type { FindCompileCallsResult } from '@web-loom/template-core-tooling';
import type { PrecompileCache } from './precompile-cache.js';
import {
  transformPrecompile,
  type PrecompileTransformContext,
  type PrecompileTransformResult,
} from './precompile-transform.js';

export interface DevPrecompileParams {
  cache: PrecompileCache;
  sourcePath: string;
  code: string;
  found: FindCompileCallsResult;
}

/**
 * Dev-only path: rewrite static templates to `fromPrecompiled(plan)` like production build,
 * with an in-memory cache so unchanged files skip re-precompilation on HMR passes.
 */
export function runDevPrecompile(
  ctx: PrecompileTransformContext,
  params: DevPrecompileParams,
): PrecompileTransformResult {
  const contentHash = params.cache.hash(params.code);
  const cached = params.cache.get(params.sourcePath, contentHash);
  if (cached) {
    return { code: cached.code, map: cached.map };
  }

  const result = transformPrecompile(ctx, params.code, params.sourcePath, params.found);
  params.cache.set(params.sourcePath, {
    contentHash,
    code: result.code,
    map: result.map,
  });
  return result;
}
