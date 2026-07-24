import { TemplateSyntaxError } from '../errors.js';
import { parseExpression } from './expression.js';
import { tokenizeText } from './text.js';
import type { BindingRecord, NodePath } from '../types.js';

const NOT_YET_SUPPORTED_PREFIXES = ['use:', 'bind:'];

/**
 * Extracts directive/interpolated attributes from `el` into Binding Records
 * and removes them from the element (Requirement 1.5/1.6) — plain,
 * non-interpolated attributes are left exactly as authored.
 */
export function compileAttributes(el: Element, path: NodePath): BindingRecord[] {
  const bindings: BindingRecord[] = [];
  const attrs = Array.from(el.attributes);

  for (const attr of attrs) {
    const name = attr.name;
    const value = attr.value;

    if (name.startsWith('on:')) {
      const eventName = name.slice(3);
      if (eventName.includes('.')) {
        throw new TemplateSyntaxError(
          `Event modifiers ("${name}") are not implemented in Phase 1 — use a plain "on:${eventName.split('.')[0]}" binding. See PRD §11 Phase 2.`,
        );
      }
      bindings.push({ kind: 'event', path, event: eventName, handler: parseExpression(value) });
      el.removeAttribute(name);
      continue;
    }

    if (NOT_YET_SUPPORTED_PREFIXES.some((prefix) => name.startsWith(prefix))) {
      throw new TemplateSyntaxError(`"${name}" is not implemented in Phase 1. See PRD §11 Phase 2.`);
    }

    if (name.startsWith('class:')) {
      bindings.push({ kind: 'class', path, name: name.slice(6), expr: parseExpression(value) });
      el.removeAttribute(name);
      continue;
    }

    if (name.startsWith('style:')) {
      bindings.push({ kind: 'style', path, prop: name.slice(6), expr: parseExpression(value) });
      el.removeAttribute(name);
      continue;
    }

    if (name.startsWith(':')) {
      bindings.push({ kind: 'prop-or-attr', path, name: name.slice(1), expr: parseExpression(value) });
      el.removeAttribute(name);
      continue;
    }

    const token = tokenizeText(value);
    if (token.kind === 'raw-html') {
      throw new TemplateSyntaxError(
        `{{{ }}} raw HTML is not allowed in attribute values (attribute "${name}" on <${el.tagName.toLowerCase()}>).`,
      );
    }
    if (token.kind === 'text') {
      bindings.push({ kind: 'attr-interp', path, name, parts: token.parts });
      el.removeAttribute(name);
    }
  }

  return bindings;
}
