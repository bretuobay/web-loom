import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCspDirectives, createEmbed } from './host.js';
import { createEmbedMessage } from './protocol.js';
import { defineWidget } from './widget.js';

describe('host runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
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

  it('destroying an inline widget preserves the host-owned target and allows remount', async () => {
    const target = document.createElement('div');
    target.id = 'slot';
    document.body.append(target);
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
              mount() {
                return undefined;
              },
            }),
        },
      ],
    });

    const first = await runtime.mount('advisor', target, { placement: 'inline' });
    expect(target.querySelector('[data-wl-host="inline"]')).toBeTruthy();
    first.destroy();
    expect(document.getElementById('slot')).toBe(target);
    expect(target.querySelector('[data-wl-host="inline"]')).toBeNull();

    const second = await runtime.mount('advisor', target, { placement: 'inline' });
    expect(second.state).toBe('open');
    expect(document.getElementById('slot')).toBe(target);
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

    await vi.waitFor(() => {
      expect(target.dataset.wlMounted).toBe('true');
      expect(seenProps).toHaveBeenCalledWith({ topic: 'pricing' });
    });
  });

  it('batches declarative scans through the fallback scheduler', async () => {
    vi.useFakeTimers();
    const first = document.createElement('div');
    first.dataset.wlWidget = 'advisor';
    const second = document.createElement('div');
    second.dataset.wlWidget = 'advisor';
    const mounts = vi.fn();
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
              mount() {
                mounts();
              },
            }),
        },
      ],
    });
    runtime.scan();
    document.body.append(first, second);

    await vi.runAllTimersAsync();

    expect(first.dataset.wlMounted).toBe('true');
    expect(second.dataset.wlMounted).toBe('true');
    expect(mounts).toHaveBeenCalledTimes(2);
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

  it('keeps explicit config values when remote config resolves later', async () => {
    const runtime = createEmbed({
      clientId: 'ck_live_1',
      configEndpoint: 'https://api.example/config',
      theme: 'explicit-theme',
      locale: 'en',
      metadata: { source: 'explicit' },
      runtimeUrl: 'https://cdn.example/explicit.js',
      fetchRemoteConfig: async () =>
        new Response(
          JSON.stringify({
            theme: 'remote-theme',
            locale: 'fr',
            metadata: { source: 'remote', remoteOnly: true },
            runtimeUrl: 'https://cdn.example/remote.js',
          }),
        ),
    });

    await runtime.ready();

    expect(runtime.config.theme).toBe('explicit-theme');
    expect(runtime.config.locale).toBe('en');
    expect(runtime.config.runtimeUrl).toBe('https://cdn.example/explicit.js');
    expect(runtime.config.metadata).toEqual({ source: 'explicit', remoteOnly: true });
  });

  it('does not reject secret-like metadata values', () => {
    expect(() =>
      createEmbed({
        clientId: 'ck_live_1',
        metadata: { label: 'sk_something' },
      }),
    ).not.toThrow();
  });

  it('inline widgets without a module fail clearly instead of falling back to iframe', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const runtime = createEmbed({
      clientId: 'ck_live_1',
      widgets: [{ name: 'advisor', placements: ['inline'] }],
    });

    await expect(runtime.mount('advisor', target, { placement: 'inline' })).rejects.toMatchObject({
      code: 'LOAD_FAILED',
    });
  });
});
