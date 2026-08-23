import type { FormatTemplateOptions, FormatTemplateResult } from '../types.js';
import { analyzeTemplate } from './analyze.js';

export type { FormatTemplateOptions, FormatTemplateResult } from '../types.js';

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

type TokenKind = 'text' | 'mustache' | 'tag' | 'raw';

type MustacheKind = 'block-open' | 'block-close' | 'block-mid' | 'partial' | 'inline';

type TagKind = 'open' | 'close' | 'self' | 'other';

interface Token {
  kind: TokenKind;
  value: string;
  mustacheKind?: MustacheKind;
  tagKind?: TagKind;
  tagName?: string;
}

/**
 * Pretty-print a template string after {@link analyzeTemplate} validation.
 * Uses the original source tokens so directives (`on:click`, `:href`, `class:active`) stay intact.
 */
export function formatTemplate(source: string, options: FormatTemplateOptions = {}): FormatTemplateResult {
  const analysis = analyzeTemplate(source, options);
  if (!analysis.ok) {
    return { ok: false, diagnostics: analysis.diagnostics };
  }

  const indentSize = options.indent ?? 2;
  const formatted = prettyPrintTemplate(source, indentSize);
  return {
    ok: true,
    formatted,
    diagnostics: analysis.diagnostics,
    unchanged: normalizeTrailingNewline(formatted) === normalizeTrailingNewline(source),
  };
}

function normalizeTrailingNewline(source: string): string {
  return source.replace(/\s+$/, '') + '\n';
}

function prettyPrintTemplate(source: string, indentSize: number): string {
  const tokens = tokenize(source);
  let indent = 0;
  const pad = () => ' '.repeat(indent * indentSize);
  const lines: string[] = [];
  let line = '';

  const flushLine = () => {
    const trimmed = line.trimEnd();
    if (trimmed.length > 0) {
      lines.push(trimmed);
    }
    line = '';
  };

  const writeLine = (value: string) => {
    flushLine();
    lines.push(`${pad()}${value.trim()}`);
  };

  for (const token of tokens) {
    switch (token.kind) {
      case 'raw':
        flushLine();
        lines.push(token.value);
        break;
      case 'mustache':
        if (
          token.mustacheKind === 'block-open' ||
          token.mustacheKind === 'block-mid' ||
          token.mustacheKind === 'partial'
        ) {
          writeLine(token.value);
          if (token.mustacheKind === 'block-open') {
            indent += 1;
          }
        } else if (token.mustacheKind === 'block-close') {
          indent = Math.max(0, indent - 1);
          writeLine(token.value);
        } else {
          if (!line.trim()) {
            line = pad();
          }
          line += token.value;
        }
        break;
      case 'tag':
        if (token.tagKind === 'close') {
          indent = Math.max(0, indent - 1);
          writeLine(token.value);
        } else if (token.tagKind === 'open') {
          writeLine(token.value);
          indent += 1;
        } else {
          writeLine(token.value);
        }
        break;
      case 'text': {
        const collapsed = collapseTextWhitespace(token.value);
        if (!collapsed) {
          continue;
        }
        if (!line.trim()) {
          line = pad();
        }
        line += collapsed;
        break;
      }
    }
  }

  flushLine();
  if (lines.length === 0) {
    return '\n';
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < source.length) {
    if (source.startsWith('{{', index)) {
      const end = source.indexOf('}}', index + 2);
      if (end === -1) {
        tokens.push({ kind: 'text', value: source.slice(index) });
        break;
      }
      const value = source.slice(index, end + 2);
      tokens.push({ kind: 'mustache', value, mustacheKind: classifyMustache(value) });
      index = end + 2;
      continue;
    }

    if (source[index] === '<') {
      const end = source.indexOf('>', index);
      if (end === -1) {
        tokens.push({ kind: 'text', value: source.slice(index) });
        break;
      }
      const value = source.slice(index, end + 1);
      const tag = classifyTag(value);
      tokens.push(tag);
      index = end + 1;

      if (tag.tagKind === 'open' && (tag.tagName === 'script' || tag.tagName === 'style')) {
        const rest = source.slice(index);
        const closeRe = new RegExp(`</${tag.tagName}\\s*>`, 'i');
        const closeMatch = closeRe.exec(rest);
        if (closeMatch) {
          const rawEnd = closeMatch.index + closeMatch[0].length;
          tokens.push({ kind: 'raw', value: value + rest.slice(0, rawEnd) });
          index += rawEnd;
        }
      }
      continue;
    }

    const nextMustache = source.indexOf('{{', index);
    const nextTag = source.indexOf('<', index);
    let end = source.length;
    if (nextMustache >= 0) {
      end = Math.min(end, nextMustache);
    }
    if (nextTag >= 0) {
      end = Math.min(end, nextTag);
    }

    const value = source.slice(index, end);
    if (value) {
      tokens.push({ kind: 'text', value });
    }
    index = end;
  }

  return tokens;
}

function classifyMustache(value: string): MustacheKind {
  const inner = value.slice(2, -2).trim();
  if (/^#(?:>|slot\b|if|each|switch|case|default)\b/.test(inner) || /^#>/.test(inner)) {
    return 'block-open';
  }
  if (/^\/(?:if|each|switch|case|default|slot|[A-Za-z_][A-Za-z0-9_-]*)\b/.test(inner)) {
    return 'block-close';
  }
  if (/^else(?:\s+if\b|\s*$)/.test(inner)) {
    return 'block-mid';
  }
  if (/^>/.test(inner)) {
    return 'partial';
  }
  return 'inline';
}

function classifyTag(value: string): Token {
  const trimmed = value.trim();
  if (trimmed.startsWith('<!--') || trimmed.startsWith('<!') || trimmed.startsWith('<?')) {
    return { kind: 'tag', tagKind: 'other', value };
  }

  const tagName = getTagName(trimmed);
  const isClose = /^<\//.test(trimmed);
  const isSelf = /\/>\s*$/.test(trimmed) || (!isClose && VOID_TAGS.has(tagName));

  if (isClose) {
    return { kind: 'tag', tagKind: 'close', value, tagName };
  }
  if (isSelf) {
    return { kind: 'tag', tagKind: 'self', value, tagName };
  }
  return { kind: 'tag', tagKind: 'open', value, tagName };
}

function getTagName(tag: string): string {
  const match = tag.match(/^<\/?([a-zA-Z][\w-]*)/);
  return match?.[1]?.toLowerCase() ?? '';
}

function collapseTextWhitespace(text: string): string {
  if (/^\s+$/.test(text)) {
    return '';
  }
  return text.replace(/\s+/g, ' ').trim();
}
