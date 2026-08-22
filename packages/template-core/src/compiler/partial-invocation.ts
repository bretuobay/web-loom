import { TemplateSyntaxError } from '../errors.js';
import type { ExpressionNode } from '../types.js';
import { parseExpression } from './expression.js';

export interface PartialInvocation {
  name: string;
  context: ExpressionNode | null;
  args: Record<string, ExpressionNode> | null;
}

const NAME_RE = /^[A-Za-z_][A-Za-z0-9_-]*/;
const KEY_RE = /^[A-Za-z_][A-Za-z0-9_$]*/;
const HASH_START_RE = /^[A-Za-z_][A-Za-z0-9_$]*\s*(=)(?!=)/;

/**
 * Parses the body of a `{{> … }}` invocation after the name has been
 * preprocessed into a comment marker.
 *
 * - `{{> card}}` — inherit the enclosing scope
 * - `{{> card user$}}` — one context expression (legacy)
 * - `{{> card count=n href=path}}` — named hash args (isolated at runtime)
 */
export function parsePartialInvocation(raw: string): PartialInvocation {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new TemplateSyntaxError('Malformed partial; expected {{> name}}, {{> name context}}, or {{> name key=value}}.');
  }

  const nameMatch = NAME_RE.exec(trimmed);
  if (!nameMatch) {
    throw new TemplateSyntaxError(`Malformed partial "${raw}"; expected {{> name [context]}} or {{> name key=value}}.`);
  }

  const name = nameMatch[0];
  const rest = trimmed.slice(name.length).trim();
  if (!rest) return { name, context: null, args: null };

  if (HASH_START_RE.test(rest)) {
    return { name, context: null, args: parseHashArgs(rest, raw) };
  }

  return { name, context: parseExpression(rest), args: null };
}

function parseHashArgs(src: string, raw: string): Record<string, ExpressionNode> {
  const args: Record<string, ExpressionNode> = {};
  let i = 0;

  while (i < src.length) {
    while (i < src.length && /\s/.test(src[i]!)) i++;
    if (i >= src.length) break;

    const keyMatch = KEY_RE.exec(src.slice(i));
    if (!keyMatch) {
      throw new TemplateSyntaxError(`Malformed partial "${raw}"; expected named arguments as key=value pairs.`);
    }
    const key = keyMatch[0];
    i += key.length;
    while (i < src.length && /\s/.test(src[i]!)) i++;
    if (src[i] !== '=' || src[i + 1] === '=') {
      throw new TemplateSyntaxError(`Malformed partial "${raw}"; expected "=" after argument "${key}".`);
    }
    i += 1;
    while (i < src.length && /\s/.test(src[i]!)) i++;

    const valueStart = i;
    i = findHashValueEnd(src, i);
    const valueSrc = src.slice(valueStart, i).trim();
    if (!valueSrc) {
      throw new TemplateSyntaxError(`Malformed partial "${raw}"; argument "${key}" is missing a value.`);
    }
    if (Object.prototype.hasOwnProperty.call(args, key)) {
      throw new TemplateSyntaxError(`Malformed partial "${raw}"; duplicate argument "${key}".`);
    }
    args[key] = parseExpression(valueSrc);
  }

  if (Object.keys(args).length === 0) {
    throw new TemplateSyntaxError(`Malformed partial "${raw}"; expected at least one key=value argument.`);
  }
  return args;
}

function findHashValueEnd(src: string, start: number): number {
  let quote: '"' | "'" | null = null;
  let i = start;

  while (i < src.length) {
    const c = src[i]!;
    if (quote) {
      if (c === '\\') {
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      i += 1;
      continue;
    }
    if (/\s/.test(c) && HASH_START_RE.test(src.slice(i).trimStart())) {
      return i;
    }
    i += 1;
  }
  return i;
}
