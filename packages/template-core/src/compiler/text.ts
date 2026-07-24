import { TemplateSyntaxError } from '../errors.js';
import { parseExpression } from './expression.js';
import type { ExpressionNode, TextPart } from '../types.js';

export type TextToken =
  | { kind: 'static'; value: string }
  | { kind: 'text'; parts: TextPart[] }
  | { kind: 'raw-html'; expr: ExpressionNode };

/**
 * Tokenizes a text (or attribute-value) string into static/expression parts.
 * `{{{ expr }}}` (raw HTML) must be the *sole* content of the string — it is
 * rendered by replacing a DOM range, not by setting `textContent`, so mixing
 * it with other static/interpolated content in the same node isn't supported
 * in Phase 1 (PRD §8.1).
 */
export function tokenizeText(text: string): TextToken {
  const tripleIndex = text.indexOf('{{{');
  if (tripleIndex !== -1) {
    const before = text.slice(0, tripleIndex);
    if (before.trim() !== '') {
      throw new TemplateSyntaxError(
        `{{{ }}} raw HTML must be the sole content of its text node — found other content before it in "${text}"`,
      );
    }
    const closeIndex = text.indexOf('}}}', tripleIndex + 3);
    if (closeIndex === -1) {
      throw new TemplateSyntaxError(`Unterminated {{{ }}} in "${text}"`);
    }
    const exprSrc = text.slice(tripleIndex + 3, closeIndex);
    const after = text.slice(closeIndex + 3);
    if (after.trim() !== '') {
      throw new TemplateSyntaxError(
        `{{{ }}} raw HTML must be the sole content of its text node — found other content after it in "${text}"`,
      );
    }
    return { kind: 'raw-html', expr: parseExpression(exprSrc.trim()) };
  }

  if (text.indexOf('{{') === -1) {
    return { kind: 'static', value: text };
  }

  const parts: TextPart[] = [];
  let pos = 0;
  while (pos < text.length) {
    const openIndex = text.indexOf('{{', pos);
    if (openIndex === -1) {
      parts.push({ static: text.slice(pos) });
      break;
    }
    if (openIndex > pos) {
      parts.push({ static: text.slice(pos, openIndex) });
    }
    const closeIndex = text.indexOf('}}', openIndex + 2);
    if (closeIndex === -1) {
      throw new TemplateSyntaxError(`Unterminated {{ }} in "${text}"`);
    }
    const exprSrc = text.slice(openIndex + 2, closeIndex);
    parts.push({ expr: parseExpression(exprSrc.trim()) });
    pos = closeIndex + 2;
  }
  return { kind: 'text', parts };
}
