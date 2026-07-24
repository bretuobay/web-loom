import { TemplateSyntaxError } from '../errors.js';
import type { ExpressionNode } from '../types.js';

const RESERVED_LITERALS: Record<string, string | number | boolean | null> = {
  true: true,
  false: false,
  null: null,
};

class Cursor {
  pos = 0;
  constructor(public readonly src: string) {}

  get length(): number {
    return this.src.length;
  }

  peek(offset = 0): string {
    return this.src[this.pos + offset] ?? '';
  }

  eof(): boolean {
    return this.pos >= this.src.length;
  }

  startsWith(s: string): boolean {
    return this.src.startsWith(s, this.pos);
  }

  advance(n = 1): void {
    this.pos += n;
  }

  skipWs(): void {
    while (!this.eof() && /\s/.test(this.peek())) this.advance();
  }
}

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}

function isIdentStart(c: string): boolean {
  return /[A-Za-z_]/.test(c);
}

function isIdentPart(c: string): boolean {
  // '$' is allowed within/at the end of an identifier (the repo-wide `count$`
  // signal-naming convention) but not as the leading character — a leading
  // '$' is reserved for the `$event` local (see readPathHead).
  return /[A-Za-z0-9_$]/.test(c);
}

/**
 * Parses a single expression per PRD §6.7: literals, scope paths, helper
 * calls, unary `!`, comparisons, and `&&`/`||`/`??`. No `eval`/`new Function`
 * is ever used — this is a hand-rolled recursive-descent parser so the
 * result can be evaluated under a strict CSP.
 */
export function parseExpression(source: string): ExpressionNode {
  const cursor = new Cursor(source);
  cursor.skipWs();
  const node = parseLogicalOr(cursor);
  cursor.skipWs();
  if (!cursor.eof()) {
    throw new TemplateSyntaxError(
      `Unexpected content in expression "${source}" at position ${cursor.pos}: "${cursor.src.slice(cursor.pos)}". ` +
        `Arithmetic, assignment, and ternary expressions are not allowed — move this logic to a ViewModel computed().`,
    );
  }
  return node;
}

function parseLogicalOr(cursor: Cursor): ExpressionNode {
  let left = parseLogicalAnd(cursor);
  for (;;) {
    cursor.skipWs();
    if (cursor.startsWith('||')) {
      cursor.advance(2);
      left = { kind: 'logical', op: '||', left, right: parseLogicalAnd(cursor) };
    } else if (cursor.startsWith('??')) {
      cursor.advance(2);
      left = { kind: 'logical', op: '??', left, right: parseLogicalAnd(cursor) };
    } else {
      return left;
    }
  }
}

function parseLogicalAnd(cursor: Cursor): ExpressionNode {
  let left = parseEquality(cursor);
  for (;;) {
    cursor.skipWs();
    if (cursor.startsWith('&&')) {
      cursor.advance(2);
      left = { kind: 'logical', op: '&&', left, right: parseEquality(cursor) };
    } else {
      return left;
    }
  }
}

function parseEquality(cursor: Cursor): ExpressionNode {
  let left = parseRelational(cursor);
  for (;;) {
    cursor.skipWs();
    if (cursor.startsWith('===')) {
      cursor.advance(3);
      left = { kind: 'binary', op: '===', left, right: parseRelational(cursor) };
    } else if (cursor.startsWith('!==')) {
      cursor.advance(3);
      left = { kind: 'binary', op: '!==', left, right: parseRelational(cursor) };
    } else {
      return left;
    }
  }
}

function parseRelational(cursor: Cursor): ExpressionNode {
  let left = parseUnary(cursor);
  for (;;) {
    cursor.skipWs();
    if (cursor.startsWith('<=')) {
      cursor.advance(2);
      left = { kind: 'binary', op: '<=', left, right: parseUnary(cursor) };
    } else if (cursor.startsWith('>=')) {
      cursor.advance(2);
      left = { kind: 'binary', op: '>=', left, right: parseUnary(cursor) };
    } else if (cursor.peek() === '<') {
      cursor.advance(1);
      left = { kind: 'binary', op: '<', left, right: parseUnary(cursor) };
    } else if (cursor.peek() === '>') {
      cursor.advance(1);
      left = { kind: 'binary', op: '>', left, right: parseUnary(cursor) };
    } else {
      return left;
    }
  }
}

function parseUnary(cursor: Cursor): ExpressionNode {
  cursor.skipWs();
  if (cursor.peek() === '!') {
    cursor.advance(1);
    return { kind: 'unary-not', operand: parseUnary(cursor) };
  }
  return parsePrimary(cursor);
}

function parsePrimary(cursor: Cursor): ExpressionNode {
  cursor.skipWs();
  if (cursor.eof()) {
    throw new TemplateSyntaxError(`Unexpected end of expression: "${cursor.src}"`);
  }
  const ch = cursor.peek();

  if (ch === '(') {
    cursor.advance(1);
    const node = parseLogicalOr(cursor);
    cursor.skipWs();
    if (cursor.peek() !== ')') {
      throw new TemplateSyntaxError(`Expected ")" in expression "${cursor.src}" at position ${cursor.pos}`);
    }
    cursor.advance(1);
    return node;
  }

  if (ch === '"' || ch === "'") {
    return parseStringLiteral(cursor);
  }

  if (isDigit(ch) || (ch === '-' && isDigit(cursor.peek(1)))) {
    return parseNumberLiteral(cursor);
  }

  if (ch === '`') {
    throw new TemplateSyntaxError(
      `Template literals are not allowed in template expressions (in "${cursor.src}"). Move this logic to a ViewModel computed().`,
    );
  }

  if (isIdentStart(ch) || ch === '@' || ch === '$' || cursor.startsWith('../')) {
    if (isIdentStart(ch)) {
      const word = peekWord(cursor);
      if (Object.prototype.hasOwnProperty.call(RESERVED_LITERALS, word)) {
        cursor.advance(word.length);
        return { kind: 'literal', value: RESERVED_LITERALS[word]! };
      }
    }
    return parsePathOrCall(cursor);
  }

  throw new TemplateSyntaxError(
    `Unexpected character "${ch}" in template expression "${cursor.src}" at position ${cursor.pos}. ` +
      `Arithmetic, assignment, and ternary expressions are not allowed — move this logic to a ViewModel computed().`,
  );
}

function peekWord(cursor: Cursor): string {
  let end = cursor.pos;
  while (end < cursor.length && isIdentPart(cursor.src[end]!)) end++;
  return cursor.src.slice(cursor.pos, end);
}

function parsePathOrCall(cursor: Cursor): ExpressionNode {
  let parentHops = 0;
  while (cursor.startsWith('../')) {
    parentHops++;
    cursor.advance(3);
  }

  const head = readPathHead(cursor);
  if (head === 'new') {
    throw new TemplateSyntaxError(
      `"new" is not allowed in template expressions (in "${cursor.src}"). Move this logic to a ViewModel computed().`,
    );
  }
  const segments: string[] = [head];
  const isSpecialHead = head === 'this' || head.startsWith('@') || head === '$event';

  while (cursor.peek() === '.') {
    cursor.advance(1);
    segments.push(readIdentifier(cursor));
  }

  cursor.skipWs();
  if (cursor.peek() === '(') {
    if (parentHops !== 0 || segments.length !== 1 || isSpecialHead) {
      throw new TemplateSyntaxError(
        `Only a single identifier may be called (e.g. "remove(this)") — "${segments.join('.')}(...)" is not allowed in template expressions.`,
      );
    }
    cursor.advance(1);
    const args = parseArgs(cursor);
    cursor.skipWs();
    if (cursor.peek() !== ')') {
      throw new TemplateSyntaxError(`Expected ")" after arguments in "${cursor.src}" at position ${cursor.pos}`);
    }
    cursor.advance(1);
    return { kind: 'helper-call', callee: segments[0]!, args };
  }

  return { kind: 'path', segments, parentHops };
}

function readPathHead(cursor: Cursor): string {
  if (cursor.peek() === '@') {
    cursor.advance(1);
    return '@' + readIdentifier(cursor);
  }
  if (cursor.peek() === '$') {
    if (cursor.startsWith('$event') && !isIdentPart(cursor.peek(6))) {
      cursor.advance(6);
      return '$event';
    }
    throw new TemplateSyntaxError(
      `Unexpected "$" in expression "${cursor.src}" at position ${cursor.pos} — only "$event" is supported`,
    );
  }
  return readIdentifier(cursor);
}

function readIdentifier(cursor: Cursor): string {
  if (!isIdentStart(cursor.peek())) {
    throw new TemplateSyntaxError(`Expected an identifier in expression "${cursor.src}" at position ${cursor.pos}`);
  }
  const start = cursor.pos;
  cursor.advance(1);
  while (!cursor.eof() && isIdentPart(cursor.peek())) cursor.advance(1);
  return cursor.src.slice(start, cursor.pos);
}

function parseArgs(cursor: Cursor): ExpressionNode[] {
  const args: ExpressionNode[] = [];
  cursor.skipWs();
  if (cursor.peek() === ')') return args;
  args.push(parseLogicalOr(cursor));
  cursor.skipWs();
  while (cursor.peek() === ',') {
    cursor.advance(1);
    args.push(parseLogicalOr(cursor));
    cursor.skipWs();
  }
  return args;
}

function parseNumberLiteral(cursor: Cursor): ExpressionNode {
  const start = cursor.pos;
  if (cursor.peek() === '-') cursor.advance(1);
  while (!cursor.eof() && isDigit(cursor.peek())) cursor.advance(1);
  if (cursor.peek() === '.' && isDigit(cursor.peek(1))) {
    cursor.advance(1);
    while (!cursor.eof() && isDigit(cursor.peek())) cursor.advance(1);
  }
  const text = cursor.src.slice(start, cursor.pos);
  return { kind: 'literal', value: Number(text) };
}

function parseStringLiteral(cursor: Cursor): ExpressionNode {
  const quote = cursor.peek();
  cursor.advance(1);
  let value = '';
  while (!cursor.eof() && cursor.peek() !== quote) {
    if (cursor.peek() === '\\') {
      cursor.advance(1);
      value += unescapeChar(cursor.peek());
      cursor.advance(1);
    } else {
      value += cursor.peek();
      cursor.advance(1);
    }
  }
  if (cursor.eof()) {
    throw new TemplateSyntaxError(`Unterminated string literal in expression "${cursor.src}"`);
  }
  cursor.advance(1);
  return { kind: 'literal', value };
}

function unescapeChar(c: string): string {
  switch (c) {
    case 'n':
      return '\n';
    case 't':
      return '\t';
    case 'r':
      return '\r';
    case '\\':
      return '\\';
    case "'":
      return "'";
    case '"':
      return '"';
    default:
      return c;
  }
}
