import type { PartialSource, Template } from '@web-loom/template-core';

/**
 * Attaches a local `{{> name}}` map to an already-compiled template.
 * Pages keep inheriting their mount context; they just stop using the global
 * partial registry.
 */
export function withPartials<TVm extends object>(
  template: Template<TVm>,
  partials: Record<string, PartialSource>,
): Template<TVm> {
  template.partials = { ...template.partials, ...partials };
  return template;
}
