import type { Router } from '@web-loom/router-core';
import type { ElementAction } from '@web-loom/template-core';

/**
 * A delegated navigation handler for `use:` on a container element (typically
 * the app shell root). Left-clicks on same-origin `<a href>` descendants are
 * intercepted and routed through `router.push`, so individual anchors need no
 * per-element event wiring. Modified clicks (ctrl/cmd/shift/alt), non-left
 * buttons, `target` links, downloads, external origins, and `data-native`
 * anchors fall through to the browser.
 */
export function createLinkAction(router: Router): (element: Element) => ElementAction {
  return (element: Element): ElementAction => {
    const onClick = (event: Event): void => {
      const mouse = event as MouseEvent;
      if (mouse.defaultPrevented || mouse.button !== 0) return;
      if (mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (!anchor || !element.contains(anchor)) return;
      if (anchor.hasAttribute('target') || anchor.hasAttribute('download')) return;
      if (anchor.hasAttribute('data-native')) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;

      event.preventDefault();
      void router.push(url.pathname + url.search);
    };

    element.addEventListener('click', onClick);
    return {
      dispose: () => element.removeEventListener('click', onClick),
    };
  };
}
