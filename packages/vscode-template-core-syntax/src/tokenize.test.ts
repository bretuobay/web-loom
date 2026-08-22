import { beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { loadWASM, createOnigScanner, createOnigString } from 'vscode-oniguruma';
import { INITIAL, Registry, parseRawGrammar, type IGrammar } from 'vscode-textmate';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const WEB_LOOM_SCOPE = 'inline.web-loom-template';

/**
 * Minimal stand-ins for `source.ts` and `text.html.basic` — enough to host our
 * injection and prove it fires, without vendoring VS Code's real (huge)
 * TypeScript/HTML grammars, which aren't this package's responsibility to test.
 */
/**
 * `[^\`]+` (not `.+`) matters: it must stop right before a backtick, the way
 * a real token-by-token grammar naturally would, so the tokenizer's scan
 * position actually reaches the backtick as its own step — that's what lets
 * the injection compete for a match there at all.
 */
const STUB_TS_GRAMMAR = {
  scopeName: 'source.ts',
  patterns: [{ match: '[^`]+', name: 'source.ts' }],
};

const STUB_HTML_GRAMMAR = {
  scopeName: 'text.html.basic',
  patterns: [
    { match: '<[^>]+>', name: 'meta.tag.html' },
    { match: '[^<{]+', name: 'text.html.basic' },
  ],
};

let grammar: IGrammar;

beforeAll(async () => {
  const wasmPath = require.resolve('vscode-oniguruma/release/onig.wasm');
  const wasmBin = await readFile(wasmPath);
  await loadWASM(wasmBin.buffer as ArrayBuffer);

  const ourGrammarSource = await readFile(join(here, '..', 'syntaxes', 'web-loom-template.tmLanguage.json'), 'utf8');

  const registry = new Registry({
    onigLib: Promise.resolve({ createOnigScanner, createOnigString }),
    loadGrammar: async (scopeName) => {
      if (scopeName === 'source.ts') return parseRawGrammar(JSON.stringify(STUB_TS_GRAMMAR), 'source.ts.json');
      if (scopeName === 'text.html.basic')
        return parseRawGrammar(JSON.stringify(STUB_HTML_GRAMMAR), 'text.html.basic.json');
      if (scopeName === WEB_LOOM_SCOPE) return parseRawGrammar(ourGrammarSource, 'web-loom-template.tmLanguage.json');
      return null;
    },
    getInjections: (scopeName) => (scopeName === 'source.ts' ? [WEB_LOOM_SCOPE] : undefined),
  });

  const loaded = await registry.loadGrammar('source.ts');
  if (!loaded) throw new Error('failed to load stub source.ts grammar');
  grammar = loaded;
});

function tokenize(line: string) {
  const result = grammar.tokenizeLine(line, INITIAL);
  return result.tokens.map((token) => ({
    text: line.slice(token.startIndex, token.endIndex),
    scopes: token.scopes,
  }));
}

/** Threads ruleStack across lines — required for a begin/end region (the compile(`...`) call) that spans multiple lines, which is how real templates in this codebase are written. */
function tokenizeLines(lines: string[]) {
  let state = INITIAL;
  return lines.map((line) => {
    const result = grammar.tokenizeLine(line, state);
    state = result.ruleStack;
    return result.tokens.map((token) => ({ text: line.slice(token.startIndex, token.endIndex), scopes: token.scopes }));
  });
}

function scopesFor(tokens: ReturnType<typeof tokenize>, text: string): string[] {
  const match = tokens.find((token) => token.text === text);
  if (!match)
    throw new Error(`no token found for ${JSON.stringify(text)} among ${JSON.stringify(tokens.map((t) => t.text))}`);
  return match.scopes;
}

describe('web-loom-template.tmLanguage.json', () => {
  it('injects into a compile(`...`) template literal', () => {
    const tokens = tokenize('const t = compile(`<h1>hi</h1>`);');
    const inside = tokens.find((token) => token.text === '<h1>');
    expect(inside?.scopes).toContain('meta.embedded.block.html');
  });

  it('does not inject outside of a compile() call', () => {
    const tokens = tokenize('const t = `<h1>hi</h1>`;');
    const inside = tokens.find((token) => token.text === '<h1>');
    expect(inside?.scopes ?? []).not.toContain('meta.embedded.block.html');
  });

  it('tags plain interpolation braces and expression content', () => {
    const tokens = tokenize('compile(`<h1>{{ title$ }}</h1>`)');
    expect(scopesFor(tokens, '{{')).toContain('punctuation.definition.template-expression.begin.web-loom');
    expect(scopesFor(tokens, 'title$')).toContain('variable.other.web-loom');
    expect(scopesFor(tokens, '}}')).toContain('punctuation.definition.template-expression.end.web-loom');
  });

  it('tags raw HTML triple-mustache distinctly from double-mustache', () => {
    const tokens = tokenize('compile(`<div>{{{ rawHtml$ }}}</div>`)');
    expect(scopesFor(tokens, '{{{')).toContain('punctuation.definition.template-expression.begin.web-loom');
    expect(scopesFor(tokens, '}}}')).toContain('punctuation.definition.template-expression.end.web-loom');
  });

  it('tags #if/else if/else/\\/if as keywords', () => {
    const tokens = tokenize('compile(`{{#if isLoading$}}{{else if error$}}{{else}}{{/if}}`)');
    expect(scopesFor(tokens, '#if')).toContain('keyword.control.web-loom');
    expect(scopesFor(tokens, 'else if')).toContain('keyword.control.web-loom');
    expect(scopesFor(tokens, '/if')).toContain('keyword.control.web-loom');
  });

  it('tags #each and its key= argument, and /each', () => {
    const tokens = tokenize('compile(`{{#each todos$ key=id}}{{/each}}`)');
    expect(scopesFor(tokens, '#each')).toContain('keyword.control.web-loom');
    expect(scopesFor(tokens, '/each')).toContain('keyword.control.web-loom');
  });

  it('tags #switch/#case/#default and their close tags', () => {
    const tokens = tokenize(
      'compile(`{{#switch state.theme$}}{{#case "light"}}{{#default}}{{/default}}{{/case}}{{/switch}}`)',
    );
    expect(scopesFor(tokens, '#switch')).toContain('keyword.control.web-loom');
    expect(scopesFor(tokens, '#case')).toContain('keyword.control.web-loom');
    expect(scopesFor(tokens, '#default')).toContain('keyword.control.web-loom');
    expect(scopesFor(tokens, '/switch')).toContain('keyword.control.web-loom');
  });

  it('tags partial references', () => {
    const tokens = tokenize('compile(`{{> header}}`)');
    expect(scopesFor(tokens, '>')).toContain('keyword.control.web-loom');
  });

  it('tags @index and $event as language variables', () => {
    const tokens = tokenize('compile(`{{ @index }}`)');
    expect(scopesFor(tokens, '@index')).toContain('variable.language.web-loom');
  });

  it('does not fire on an unrelated .compile( method call', () => {
    const tokens = tokenize('const re = pattern.compile(`abc`);');
    const inside = tokens.find((token) => token.text === 'abc');
    expect(inside?.scopes ?? []).not.toContain('meta.embedded.block.html');
  });

  it('spans a realistic multi-line template (the region survives across lines)', () => {
    const [line1, line2, line3, line4] = tokenizeLines([
      'export const headerTemplate = compile(`',
      '  <h1>{{ title$ }}</h1>',
      '  <button on:click="save">Save</button>',
      '`);',
    ]);

    expect(line1.find((t) => t.text === '`')?.scopes).toContain('punctuation.definition.string.template.begin.ts');

    const h1Open = line2.find((t) => t.text === '<h1>');
    expect(h1Open?.scopes).toContain('meta.embedded.block.html');
    expect(scopesFor(line2, 'title$')).toContain('variable.other.web-loom');

    const button = line3.find((t) => t.text.includes('<button'));
    expect(button?.scopes).toContain('meta.embedded.block.html');

    expect(line4.find((t) => t.text === '`')?.scopes).toContain('punctuation.definition.string.template.end.ts');
    const afterClose = line4.find((t) => t.text === ');');
    expect(afterClose?.scopes ?? []).not.toContain('meta.embedded.block.html');
  });

  it('survives the real header.ts template (apps/ecommerce-template-core) without error', () => {
    // Verbatim from apps/ecommerce-template-core/src/templates/header.ts.
    const lines = tokenizeLines([
      'export const headerTemplate = compile(`',
      '  <header class="app-header">',
      '    <div class="brand-block">',
      '      <p class="brand-kicker">Web Loom Commerce · Template Core</p>',
      '      <h1>Loom Market</h1>',
      '    </div>',
      '    <nav class="header-nav" aria-label="Primary navigation">',
      '      <a href="/" on:click.prevent="navigateFromClick">Storefront</a>',
      '      <a href="/checkout" on:click.prevent="navigateFromClick">Checkout</a>',
      '    </nav>',
      '    <div class="header-actions">',
      '      <button class="ghost-btn" type="button" on:click="actions.openPalette">Command Menu</button>',
      '      <button class="ghost-btn" type="button" on:click="actions.toggleTheme">',
      '        {{#switch state.theme$}}{{#case "light"}}Dark{{/case}}{{#default}}Light{{/default}}{{/switch}} Theme',
      '      </button>',
      '      <button class="brand-btn" type="button" on:click="actions.openCart">Cart ({{ cart.itemCount }})</button>',
      '    </div>',
      '  </header>',
      '`);',
    ]);

    const switchLine = lines[13];
    expect(scopesFor(switchLine, '#switch')).toContain('keyword.control.web-loom');
    expect(scopesFor(switchLine, '#case')).toContain('keyword.control.web-loom');
    expect(scopesFor(switchLine, '"light"')).toContain('string.quoted.web-loom');
    expect(scopesFor(switchLine, '#default')).toContain('keyword.control.web-loom');

    const cartLine = lines[15];
    expect(scopesFor(cartLine, 'cart.itemCount')).toContain('variable.other.web-loom');

    // Everything inside the region got the embedded-HTML scope, and the final `);` didn't.
    expect(lines[4].find((t) => t.text.includes('Loom Market'))?.scopes).toContain('meta.embedded.block.html');
    expect(lines[18].find((t) => t.text === ');')?.scopes ?? []).not.toContain('meta.embedded.block.html');
  });
});
