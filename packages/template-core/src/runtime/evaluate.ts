import { isSignal } from '@web-loom/signals-core';
import type { ExpressionNode, Scope } from '../types.js';

function unwrapSignal(value: unknown): unknown {
  return isSignal(value) ? value.get() : value;
}

export interface ResolvedValue {
  value: unknown;
  owner: unknown;
}

/**
 * Resolves a dotted path against the Scope Chain (§5 / PRD §6.3), unwrapping
 * a Signal at every segment it passes through so effects created around this
 * call auto-track every Signal on the path. Returns both the final value and
 * its immediate owner so callers (event bindings) can invoke methods with the
 * correct `this`.
 */
export function resolveScopeValue(segments: string[], parentHops: number, scope: Scope): ResolvedValue {
  let s: Scope | null = scope;
  for (let i = 0; i < parentHops; i++) {
    s = s?.parent ?? null;
  }
  if (!s) return { value: undefined, owner: undefined };

  const [head, ...rest] = segments as [string, ...string[]];
  let owner: unknown;
  let current: unknown;

  if (head === 'this') {
    current = s.self;
  } else if (head in s.locals) {
    current = s.locals[head];
  } else if (s.self != null && typeof s.self === 'object' && head in (s.self as object)) {
    owner = s.self;
    current = (s.self as Record<string, unknown>)[head];
  } else {
    current = undefined;
  }

  current = unwrapSignal(current);

  for (const seg of rest) {
    if (current == null) return { value: undefined, owner: undefined };
    owner = current;
    current = unwrapSignal((current as Record<string, unknown>)[seg]);
  }

  return { value: current, owner };
}

/**
 * Resolves a single-segment name by walking *up* the Scope Chain (current
 * scope's `self`/`locals`, then each ancestor's) until it's found. Used only
 * for resolving the *callable* in event handlers and call-form helper
 * callees — actions like `remove`/`increment` conventionally live on the
 * root ViewModel and should be reachable from inside `{{#each}}`/`{{#if}}`
 * without an author having to count `../` hops that would break if the
 * template were later nested one level deeper. Plain data paths do **not**
 * use this — `evaluate`/`resolveScopeValue` deliberately do not fall back to
 * an outer scope for a bare identifier (§5), since silently reading through
 * to a same-named outer property would be exactly the "hidden magic" this
 * engine avoids for data.
 */
export function resolveInChain(segments: string[], startScope: Scope): ResolvedValue {
  let s: Scope | null = startScope;
  while (s) {
    const result = resolveScopeValue(segments, 0, s);
    if (result.value !== undefined) return result;
    s = s.parent;
  }
  return { value: undefined, owner: undefined };
}

export function truthy(value: unknown): boolean {
  return Boolean(value);
}

/**
 * Evaluates an ExpressionNode against a Scope. Call from within an
 * `effect()` for reactive bindings — every Signal read via
 * `resolveScopeValue` is auto-tracked by signals-core.
 */
export function evaluate(node: ExpressionNode, scope: Scope, helpers: Record<string, (...args: unknown[]) => unknown>): unknown {
  switch (node.kind) {
    case 'literal':
      return node.value;

    case 'path':
      return resolveScopeValue(node.segments, node.parentHops, scope).value;

    case 'helper-call': {
      let fn: unknown;
      let thisArg: unknown;
      if (Object.prototype.hasOwnProperty.call(helpers, node.callee)) {
        fn = helpers[node.callee];
        thisArg = undefined;
      } else {
        const resolved = resolveInChain([node.callee], scope);
        fn = resolved.value;
        thisArg = resolved.owner;
      }
      if (typeof fn !== 'function') {
        throw new TypeError(`"${node.callee}" is not a function`);
      }
      const args = node.args.map((arg) => evaluate(arg, scope, helpers));
      return (fn as (...a: unknown[]) => unknown).apply(thisArg, args);
    }

    case 'unary-not':
      return !truthy(evaluate(node.operand, scope, helpers));

    case 'binary':
      return evalBinary(node.op, evaluate(node.left, scope, helpers), evaluate(node.right, scope, helpers));

    case 'logical':
      return evalLogical(node.op, evaluate(node.left, scope, helpers), () => evaluate(node.right, scope, helpers));
  }
}

function evalBinary(op: '===' | '!==' | '<' | '<=' | '>' | '>=', left: unknown, right: unknown): boolean {
  switch (op) {
    case '===':
      return left === right;
    case '!==':
      return left !== right;
    case '<':
      return (left as never) < (right as never);
    case '<=':
      return (left as never) <= (right as never);
    case '>':
      return (left as never) > (right as never);
    case '>=':
      return (left as never) >= (right as never);
  }
}

function evalLogical(op: '&&' | '||' | '??', left: unknown, evalRight: () => unknown): unknown {
  switch (op) {
    case '&&':
      return truthy(left) ? evalRight() : left;
    case '||':
      return truthy(left) ? left : evalRight();
    case '??':
      return left ?? evalRight();
  }
}
