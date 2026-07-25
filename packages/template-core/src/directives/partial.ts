import { effect } from '@web-loom/signals-core';
import { getExistingNodes, instantiate, applyBindings } from '../runtime/bindings.js';
import { compile, getTemplateRoot } from '../runtime/renderer.js';
import { evaluate } from '../runtime/evaluate.js';
import { DisposalBag } from '../runtime/disposal.js';
import { reportDiagnostic } from '../runtime/diagnostics.js';
import type { BlockRecord, RenderContext, Scope, Template } from '../types.js';
const cache = new Map<string, Template>();
export function bindPartial(
  block: Extract<BlockRecord, { kind: 'partial' }>,
  anchor: Comment,
  scope: Scope,
  ctx: RenderContext,
  bag: DisposalBag,
): void {
  let child: DisposalBag | null = null,
    nodes: ChildNode[] = [];
  let hydrateNext = ctx.hydrating === true;
  const handle = effect(() => {
    const source = ctx.partials?.[block.name] ?? ctx.registry?.get(block.name);
    if (!source) {
      const message = `${ctx.templateName ? `[${ctx.templateName}] ` : ''}Missing partial "${block.name}".`;
      reportDiagnostic(ctx, {
        code: 'MISSING_PARTIAL',
        severity: ctx.strictPartials ? 'error' : 'warning',
        message,
        template: ctx.templateName,
        sourcePath: ctx.sourcePath,
        nodePath: block.path,
        details: { partial: block.name },
      });
      if (ctx.strictPartials) throw new Error(message);
      return;
    }
    let template: Template;
    if (typeof source === 'string') {
      template =
        cache.get(source) ??
        compile(source, {
          helpers: ctx.helpers,
          partials: ctx.partials,
          registry: ctx.registry,
          strictPartials: ctx.strictPartials,
          diagnostics: ctx.diagnostics,
          name: ctx.templateName ? `${ctx.templateName} > ${block.name}` : block.name,
        });
      cache.set(source, template);
    } else template = source;
    const context = block.context ? evaluate(block.context, scope, ctx.helpers) : scope.self;
    const partialStack = (ctx.partialStack ??= []);
    if (partialStack.includes(block.name))
      throw new Error(`Recursive partial expansion: ${[...partialStack, block.name].join(' → ')}`);
    if ((ctx.partialDepth ?? 0) >= 32)
      throw new Error(`Partial expansion depth exceeded while rendering "${block.name}".`);
    child?.dispose();
    nodes.forEach((n) => n.remove());
    child = bag.createChild();
    const partialScope: Scope = { parent: scope, self: context, locals: {} };
    ctx.partialDepth = (ctx.partialDepth ?? 0) + 1;
    partialStack.push(block.name);
    try {
      const root = getTemplateRoot(template);
      const existing = hydrateNext ? getExistingNodes(anchor, root.blueprint.childNodes.length) : [];
      hydrateNext = false;
      if (existing.length === root.blueprint.childNodes.length) {
        try {
          applyBindings(root, existing, partialScope, ctx, child);
          nodes = existing;
        } catch {
          child.reset();
          existing.forEach((node) => node.remove());
          const x = instantiate(root, partialScope, ctx, child);
          nodes = x.roots;
          anchor.after(x.fragment);
        }
      } else {
        const x = instantiate(root, partialScope, ctx, child);
        nodes = x.roots;
        anchor.after(x.fragment);
      }
    } finally {
      partialStack.pop();
      ctx.partialDepth!--;
    }
  });
  bag.add(() => {
    handle.dispose();
    child?.dispose();
    nodes.forEach((n) => n.remove());
  });
}
