import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '@web-loom/router-core';
import { createLinkAction } from './link-action.js';

function makeRouter(): Router {
  return { push: vi.fn().mockResolvedValue(undefined) } as unknown as Router;
}

function click(target: Element, init: MouseEventInit = {}): MouseEvent {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
  target.dispatchEvent(event);
  return event;
}

describe('createLinkAction', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.replaceChildren(root);
  });

  function mount(router: Router, html: string) {
    root.innerHTML = html;
    return createLinkAction(router)(root);
  }

  it('routes same-origin anchor clicks through router.push', () => {
    const router = makeRouter();
    mount(router, '<a href="/sensors?x=1">Sensors</a>');
    const event = click(root.querySelector('a')!);

    expect(router.push).toHaveBeenCalledWith('/sensors?x=1');
    expect(event.defaultPrevented).toBe(true);
  });

  it('handles clicks on elements nested inside an anchor', () => {
    const router = makeRouter();
    mount(router, '<a href="/sensors"><span>Sensors</span></a>');
    click(root.querySelector('span')!);

    expect(router.push).toHaveBeenCalledWith('/sensors');
  });

  it.each([
    ['modifier click', '<a href="/a">x</a>', { ctrlKey: true }],
    ['non-left button', '<a href="/a">x</a>', { button: 1 }],
  ] as const)('ignores %s', (_label, html, init) => {
    const router = makeRouter();
    mount(router, html);
    const event = click(root.querySelector('a')!, init);

    expect(router.push).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it.each([
    ['target links', '<a href="/a" target="_blank">x</a>'],
    ['download links', '<a href="/a" download>x</a>'],
    ['data-native links', '<a href="/a" data-native>x</a>'],
    ['external origins', '<a href="https://example.com/a">x</a>'],
    ['hash links', '<a href="#section">x</a>'],
    ['non-anchor targets', '<button>x</button>'],
  ])('ignores %s', (_label, html) => {
    const router = makeRouter();
    mount(router, html);
    const event = click(root.firstElementChild!);

    expect(router.push).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('stops intercepting after dispose', () => {
    const router = makeRouter();
    const action = mount(router, '<a href="/a">x</a>');
    action.dispose?.();
    click(root.querySelector('a')!);

    expect(router.push).not.toHaveBeenCalled();
  });
});
