import type { ExpressionNode, Scope, Template } from '../types.js';
import { bindResolvedFunction, evaluate, resolveScopeValue } from './evaluate.js';

export interface PartialContextSpec {
  context: ExpressionNode | null;
  args: Record<string, ExpressionNode> | null;
}

export interface ResolvedPartialContext {
  self: unknown;
  parent: Scope | null;
  isolated: boolean;
  dispose?: () => void;
}

/**
 * Builds the child scope inputs for a partial/component mount.
 *
 * Hash-arg calls and `template.isolated` never inherit the caller scope.
 * Legacy `{{> name}}` / `{{> name ctx}}` keep today's inherit / single-context
 * behavior unless the resolved template opted into isolation.
 */
export function resolvePartialContext(
  spec: PartialContextSpec,
  scope: Scope,
  helpers: Record<string, (...args: unknown[]) => unknown>,
  template?: Template,
): ResolvedPartialContext {
  const isolated = spec.args != null || template?.isolated === true;
  let props: unknown;

  if (spec.args) {
    const args: Record<string, unknown> = {};
    for (const [key, expr] of Object.entries(spec.args)) {
      args[key] =
        expr.kind === 'path'
          ? bindResolvedFunction(resolveScopeValue(expr.segments, expr.parentHops, scope))
          : evaluate(expr, scope, helpers);
    }
    props = args;
  } else if (spec.context) {
    props = evaluate(spec.context, scope, helpers);
  } else if (isolated) {
    props = {};
  } else {
    props = scope.self;
  }

  const created = template?.createContext?.(asPropsObject(props));
  const self = created?.context ?? props;
  return {
    self,
    parent: isolated ? null : scope,
    isolated,
    dispose: created?.dispose,
  };
}

function asPropsObject(value: unknown): object {
  return value != null && typeof value === 'object' ? value : {};
}
