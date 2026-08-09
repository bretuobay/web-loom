import { JSDOM } from 'jsdom';

const DOM_GLOBAL_KEYS = ['document', 'Node', 'Element', 'HTMLElement', 'Comment', 'Text', 'DocumentFragment'] as const;

type DomGlobalKey = (typeof DOM_GLOBAL_KEYS)[number];

/**
 * Runs `fn` with jsdom-provided DOM globals so the browser-oriented compiler
 * (`parseTemplate`, `compileFragment`) can execute in Node without a second parser.
 */
export function runWithDom<T>(fn: () => T): T {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const win = dom.window;
  const saved = new Map<DomGlobalKey, unknown>();

  const globals: Record<DomGlobalKey, unknown> = {
    document: win.document,
    Node: win.Node,
    Element: win.Element,
    HTMLElement: win.HTMLElement,
    Comment: win.Comment,
    Text: win.Text,
    DocumentFragment: win.DocumentFragment,
  };

  for (const key of DOM_GLOBAL_KEYS) {
    saved.set(key, globalThis[key as keyof typeof globalThis]);
    (globalThis as Record<string, unknown>)[key] = globals[key];
  }

  try {
    return fn();
  } finally {
    for (const key of DOM_GLOBAL_KEYS) {
      const previous = saved.get(key);
      if (previous === undefined) {
        delete (globalThis as Record<string, unknown>)[key];
      } else {
        (globalThis as Record<string, unknown>)[key] = previous;
      }
    }
  }
}
