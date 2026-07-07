import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCspDirectives, createEmbed } from './host.js';
import { createEmbedMessage } from './protocol.js';
import { defineWidget } from './widget.js';

describe('host runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('rejects secret keys in browser config', () => {
    expect(() =>
      createEmbed({
        clientId: 'sk_live_secret',
      }),
    ).toThrow('Secret keys');
  });

  it('mounts a module widget into Shadow DOM and emits events', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const completed = vi.fn();
    const commandHandler = vi.fn();
    const runtime = createEmbed({
      clientId: 'ck_live_1',
      widgets: [
        {
          name: 'advisor',
          placements: ['inline'],
          module: () =>
            defineWidget({
              name: 'advisor',
              version: '1.0.0',
              placements: ['inline'],
              mount(container, ctx) {
                expect(container).toBeInstanceOf(ShadowRoot);
                ctx.onCommand('prefill', commandHandler);
                ctx.emit('completed', { ok: true });
              },
            }),
        },
      ],
    });

    runtime.on('advisor:completed', completed);
    const handle = await runtime.mount('advisor', target, { placement: 'inline' });
    handle.send('prefill', { topic: 'pricing' });

    expect(handle.state).toBe('open');
    expect(completed).toHaveBeenCalledWith({ ok: true });
    expect(commandHandler).toHaveBeenCalledWith({ topic: 'pricing' });
  });

  it('blocks manual consent until granted and tears down on denial', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const runtime = createEmbed({
      clientId: 'ck_live_1',
      consentMode: 'manual',
      widgets: [
        {
          name: 'advisor',
          placements: ['inline'],
          module: () =>
            defineWidget({
              name: 'advisor',
              version: '1.0.0',
              placements: ['inline'],
              mount() {
                return undefined;
              },
            }),
        },
      ],
    });

    await expect(runtime.mount('advisor', target, { placement: 'inline' })).rejects.toMatchObject({
      code: 'CONSENT_REQUIRED',
    });

    runtime.consent('granted');
    const handle = await runtime.mount('advisor', target, { placement: 'inline' });
    runtime.consent('denied');
    expect(handle.state).toBe('destroyed');
  });

  it('scans data attributes and mounts declarative widgets', async () => {
    const target = document.createElement('div');
    target.dataset.wlWidget = 'advisor';
    target.dataset.wlPlacement = 'inline';
    target.dataset.wlPropTopic = 'pricing';
    document.body.append(target);
    const seenProps = vi.fn();
    const runtime = createEmbed({
      clientId: 'ck_live_1',
      widgets: [
        {
          name: 'advisor',
          placements: ['inline'],
          module: () =>
            defineWidget({
              name: 'advisor',
              version: '1.0.0',
              placements: ['inline'],
              mount(_container, ctx) {
                seenProps(ctx.props);
              },
            }),
        },
      ],
    });

    runtime.scan();

    expect(target.dataset.wlMounted).toBe('true');
    await vi.waitFor(() => {
      expect(seenProps).toHaveBeenCalledWith({ topic: 'pricing' });
    });
  });

  it('defines wl-widget custom element', async () => {
    const runtime = createEmbed({
      clientId: 'ck_live_1',
      widgets: [
        {
          name: 'advisor',
          placements: ['inline'],
          module: () =>
            defineWidget({
              name: 'advisor',
              version: '1.0.0',
              placements: ['inline'],
              mount(_container, ctx) {
                ctx.emit('ready', true);
              },
            }),
        },
      ],
    });
    runtime.defineCustomElement();
    const element = document.createElement('wl-widget');
    const ready = vi.fn();
    element.setAttribute('name', 'advisor');
    element.addEventListener('wl:ready', ready);
    document.body.append(element);

    expect(customElements.get('wl-widget')).toBeDefined();
    await vi.waitFor(() => {
      expect(ready).toHaveBeenCalled();
    });
  });

  it('handles iframe handshake, buffering, and origin rejection', async () => {
    const runtime = createEmbed({
      clientId: 'ck_live_1',
      widgets: [
        {
          name: 'advisor',
          placements: ['modal'],
          url: 'https://widgets.example/advisor.html',
          origin: 'https://widgets.example',
        },
      ],
    });
    const errors = vi.fn();
    runtime.on('error', errors);

    const handle = await runtime.open('advisor');
    handle.send('prefill', { topic: 'pricing' });

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://evil.example',
        data: createEmbedMessage({
          kind: 'handshake',
          widgetId: handle.id,
          widgetName: 'advisor',
          name: 'ready',
        }),
      }),
    );
    expect(errors).toHaveBeenCalledWith(expect.objectContaining({ code: 'ORIGIN_REJECTED' }));

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://widgets.example',
        data: createEmbedMessage({
          kind: 'handshake',
          widgetId: handle.id,
          widgetName: 'advisor',
          name: 'ready',
        }),
      }),
    );
    expect(handle.state).toBe('mounted');
  });

  it('creates CSP directives from runtime and widget config', () => {
    expect(
      createCspDirectives({
        runtimeUrl: 'https://cdn.example/embed.js',
        configEndpoint: 'https://api.example/config',
        widgets: [
          {
            name: 'advisor',
            placements: ['modal'],
            url: 'https://widgets.example/advisor.html',
          },
        ],
      }),
    ).toEqual({
      'script-src': ['https://cdn.example'],
      'connect-src': ['https://api.example'],
      'frame-src': ['https://widgets.example'],
    });
  });
});
