import { TemplateSyntaxError } from '../errors.js';
import { parseExpression } from './expression.js';
import { tokenizeText } from './text.js';
import type { BindingRecord, EventModifier, NodePath } from '../types.js';

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
      const [event, ...modifiers] = eventName.split('.');
      const allowed = new Set(['prevent', 'stop', 'once', 'capture', 'passive', 'enter', 'escape']);
      const seen = new Set<string>();
      for (const modifier of modifiers) {
        if (!allowed.has(modifier) || seen.has(modifier))
          throw new TemplateSyntaxError(`Invalid or duplicate event modifier ".${modifier}" on "${name}".`);
        seen.add(modifier);
      }
      if (seen.has('passive') && seen.has('prevent'))
        throw new TemplateSyntaxError('Event modifiers .passive and .prevent cannot be combined.');
      if ((seen.has('enter') || seen.has('escape')) && event !== 'keydown' && event !== 'keyup' && event !== 'keypress')
        throw new TemplateSyntaxError(`Keyboard modifier requires a keyboard event (found "${name}").`);
      bindings.push({
        kind: 'event',
        path,
        event: event!,
        handler: parseExpression(value),
        ...(modifiers.length ? { modifiers: modifiers as EventModifier[] } : {}),
      });
      el.removeAttribute(name);
      continue;
    }

    if (name.startsWith('bind:')) {
      const bindName = name.slice(5);
      if (bindName !== 'value' && bindName !== 'checked')
        throw new TemplateSyntaxError(`Unsupported bind target "${bindName}"; use bind:value or bind:checked.`);
      bindings.push({ kind: 'bind', path, name: bindName, target: parseExpression(value) });
      el.removeAttribute(name);
      continue;
    }
    if (name.startsWith('use:')) {
      bindings.push({ kind: 'action', path, expr: parseExpression(value) });
      el.removeAttribute(name);
      continue;
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
