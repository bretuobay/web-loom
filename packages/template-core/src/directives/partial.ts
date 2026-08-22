import { effect } from '@web-loom/signals-core';
import { getExistingNodes, instantiate, applyBindings } from '../runtime/bindings.js';
import { compile, getTemplateRoot } from '../runtime/renderer.js';
import { evaluate } from '../runtime/evaluate.js';
import { resolvePartialContext } from '../runtime/partial-context.js';
import { DisposalBag } from '../runtime/disposal.js';
import { reportDiagnostic } from '../runtime/diagnostics.js';
import type { BlockRecord, RenderContext, RootTemplate, Scope, Template } from '../types.js';

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
  let runtimeDispose: (() => void) | undefined;
  let hydrateNext = ctx.hydrating === true;

  const handle = effect(() => {
    child?.dispose();
    runtimeDispose?.();
    nodes.forEach((n) => n.remove());
    child = bag.createChild();
    nodes = [];

    if (block.name === 'yield') {
      nodes = mountYield(block, anchor, scope, ctx, child, hydrateNext);
      hydrateNext = false;
      return;
    }

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

    const template =
      typeof source === 'string'
        ? (cache.get(source) ??
          cacheSet(
            cache,
            source,
            compile(source, {
              helpers: ctx.helpers,
              partials: ctx.partials,
              registry: ctx.registry,
              strictPartials: ctx.strictPartials,
              diagnostics: ctx.diagnostics,
              name: ctx.templateName ? `${ctx.templateName} > ${block.name}` : block.name,
            }),
          ))
        : source;

    const resolved = resolvePartialContext(
      { context: block.context, args: block.args ?? null },
      scope,
      ctx.helpers,
      typeof source === 'string' ? undefined : template,
    );
    runtimeDispose = resolved.dispose;

    const partialStack = (ctx.partialStack ??= []);
    if (partialStack.includes(block.name))
      throw new Error(`Recursive partial expansion: ${[...partialStack, block.name].join(' → ')}`);
    if ((ctx.partialDepth ?? 0) >= 32)
      throw new Error(`Partial expansion depth exceeded while rendering "${block.name}".`);

    const partialScope: Scope = { parent: resolved.parent, self: resolved.self, locals: {} };
    const pushedSlots = Boolean(block.slots);
    if (block.slots) {
      (ctx.slotStack ??= []).push({ slots: block.slots, callerScope: scope });
    }
    ctx.partialDepth = (ctx.partialDepth ?? 0) + 1;
    partialStack.push(block.name);
    const childCtx: RenderContext =
      typeof source === 'string' || !template.partials
        ? ctx
        : { ...ctx, partials: { ...ctx.partials, ...template.partials } };
    try {
      const root = getTemplateRoot(template);
      nodes = mountRoot(root, anchor, partialScope, childCtx, child, hydrateNext);
      hydrateNext = false;
    } finally {
      partialStack.pop();
      ctx.partialDepth!--;
      if (pushedSlots) ctx.slotStack?.pop();
    }
  });

  bag.add(() => {
    handle.dispose();
    child?.dispose();
    runtimeDispose?.();
    nodes.forEach((n) => n.remove());
  });
}

function cacheSet(cache: Map<string, Template>, source: string, template: Template): Template {
  cache.set(source, template);
  return template;
}

function mountYield(
  block: Extract<BlockRecord, { kind: 'partial' }>,
  anchor: Comment,
  scope: Scope,
  ctx: RenderContext,
  child: DisposalBag,
  hydrateNext: boolean,
): ChildNode[] {
  const frame = ctx.slotStack?.[ctx.slotStack.length - 1];
  if (!frame) return [];
  const slotName = resolveYieldName(block, scope, ctx.helpers);
  const slot = frame.slots[slotName];
  if (!slot) return [];
  return mountRoot(slot, anchor, frame.callerScope, ctx, child, hydrateNext);
}

function resolveYieldName(
  block: Extract<BlockRecord, { kind: 'partial' }>,
  scope: Scope,
  helpers: Record<string, (...args: unknown[]) => unknown>,
): string {
  if (!block.args?.name) return 'default';
  const value = evaluate(block.args.name, scope, helpers);
  return value == null || value === '' ? 'default' : String(value);
}

function mountRoot(
  root: RootTemplate,
  anchor: Comment,
  scope: Scope,
  ctx: RenderContext,
  child: DisposalBag,
  hydrateNext: boolean,
): ChildNode[] {
  const existing = hydrateNext ? getExistingNodes(anchor, root.blueprint.childNodes.length) : [];
  if (existing.length === root.blueprint.childNodes.length) {
    try {
      applyBindings(root, existing, scope, ctx, child);
      return existing;
    } catch {
      child.reset();
      existing.forEach((node) => node.remove());
    }
  }
  const mounted = instantiate(root, scope, ctx, child);
  anchor.after(mounted.fragment);
  return mounted.roots;
}
