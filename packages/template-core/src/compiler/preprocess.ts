/**
 * Rewrites block tags ({{#if}}, {{#each}}, {{else}}, {{/if}}, {{/each}}) and
 * {{! comments }} into HTML comment markers before the source is handed to
 * the browser's native HTML parser (see PRD §8.1 "How Parsing Works").
 *
 * Comments are used (not plain text) because raw block-tag text between
 * `<table>`/`<tbody>` and `<tr>` gets foster-parented by the HTML parser —
 * relocated outside the table before any tree walk runs. HTML comments are
 * legal in every insertion context, including inside a table, so they
 * survive parsing in the correct structural position.
 *
 * `{{ }}` / `{{{ }}}` interpolations are left untouched here — they are
 * tokenized later, during the compile walk, directly from parsed text nodes.
 */

// `{{!` immediately (no intervening space) is a comment. `{{ !expr }}` (space
// before `!`) is left alone — it is a unary-not *expression*, handled by the
// text tokenizer in the compile walk, not by this pre-pass.
const COMMENT_RE = /\{\{!([^}]*)\}\}/g;

const BLOCK_TAG_RE = /\{\{\s*(#if|#each|else if|else|\/if|\/each)\s*([^}]*)\}\}/g;

function encode(raw: string): string {
  return encodeURIComponent(raw.trim());
}

export function preprocess(source: string): string {
  let out = source.replace(COMMENT_RE, '');

  out = out.replace(BLOCK_TAG_RE, (_match: string, tag: string, rest: string) => {
    switch (tag) {
      case '#if':
        return `<!--loom:#if ${encode(rest)}-->`;
      case 'else if':
        return `<!--loom:else-if ${encode(rest)}-->`;
      case 'else':
        return `<!--loom:else-->`;
      case '/if':
        return `<!--loom:/if-->`;
      case '#each':
        return `<!--loom:#each ${encode(rest)}-->`;
      case '/each':
        return `<!--loom:/each-->`;
      default:
        return _match;
    }
  });

  return trimStandaloneLines(out);
}

// Mustache "standalone line" behavior: a line containing only whitespace and
// one or more block markers is collapsed to just the marker(s), so block
// tags written on their own line don't leave stray whitespace-only text
// nodes between sibling instances (PRD §6.7, Requirement 4.5).
const STANDALONE_LINE_RE = /^[ \t]*((?:<!--loom:[^>]*-->[ \t]*)+)\r?\n/gm;

function trimStandaloneLines(input: string): string {
  return input.replace(STANDALONE_LINE_RE, '$1');
}

export function decodeMarkerExpr(raw: string): string {
  return decodeURIComponent(raw);
}
