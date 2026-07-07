import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmbedMessage } from './protocol.js';
import { createIframeWidgetRuntime, defineWidget } from './widget.js';

describe('iframe widget runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.location.hash = '';
    vi.restoreAllMocks();
  });

  it('handshakes, mounts, routes commands, and emits events', async () => {
    window.location.hash = new URLSearchParams({
      widgetId: 'advisor-1',
      widgetName: 'advisor',
      hostOrigin: 'https://host.example',
    }).toString();
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
    const command = vi.fn();
    const runtime = createIframeWidgetRuntime(
      defineWidget({
        name: 'advisor',
        version: '1.0.0',
        placements: ['modal'],
        mount(_container, ctx) {
          ctx.onCommand('prefill', command);
          ctx.emit('ready', true);
        },
      }),
    );

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'handshake', widgetId: 'advisor-1' }),
      'https://host.example',
    );

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://host.example',
        data: createEmbedMessage({
          kind: 'handshake-ack',
          widgetId: 'advisor-1',
          widgetName: 'advisor',
          name: 'ready',
          payload: {
            config: { clientId: 'ck_live_1' },
            props: { topic: 'pricing' },
          },
        }),
      }),
    );

    const ctx = await runtime.ready;
    expect(ctx.config).toEqual({ clientId: 'ck_live_1' });
    expect(ctx.props).toEqual({ topic: 'pricing' });
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'event', name: 'ready', payload: true }),
      'https://host.example',
    );

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://host.example',
        data: createEmbedMessage({
          kind: 'command',
          widgetId: 'advisor-1',
          widgetName: 'advisor',
          name: 'prefill',
          payload: { topic: 'billing' },
        }),
      }),
    );

    expect(command).toHaveBeenCalledWith({ topic: 'billing' });
    runtime.emit('completed', { ok: true });
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'event', name: 'completed', payload: { ok: true } }),
      'https://host.example',
    );
  });

  it('rejects messages from unexpected origins and cleans up', async () => {
    window.location.hash = new URLSearchParams({
      widgetId: 'advisor-1',
      widgetName: 'advisor',
      hostOrigin: 'https://host.example',
    }).toString();
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
    const onError = vi.fn();
    const command = vi.fn();
    const runtime = createIframeWidgetRuntime(
      defineWidget({
        name: 'advisor',
        version: '1.0.0',
        placements: ['modal'],
        mount(_container, ctx) {
          ctx.onCommand('prefill', command);
        },
      }),
      { onError },
    );

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://host.example',
        data: createEmbedMessage({
          kind: 'handshake-ack',
          widgetId: 'advisor-1',
          widgetName: 'advisor',
          name: 'ready',
        }),
      }),
    );
    await runtime.ready;

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://evil.example',
        data: createEmbedMessage({
          kind: 'command',
          widgetId: 'advisor-1',
          widgetName: 'advisor',
          name: 'prefill',
        }),
      }),
    );
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'ORIGIN_REJECTED' }));

    runtime.destroy();
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://host.example',
        data: createEmbedMessage({
          kind: 'command',
          widgetId: 'advisor-1',
          widgetName: 'advisor',
          name: 'prefill',
          payload: 'after-destroy',
        }),
      }),
    );
    expect(command).not.toHaveBeenCalledWith('after-destroy');
  });
});
