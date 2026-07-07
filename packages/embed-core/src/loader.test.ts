import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateSnippet, installGlobalEmbed, parseScriptConfig } from './loader.js';

describe('loader', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete window.wl;
    vi.restoreAllMocks();
  });

  it('generates an async queue snippet with query identifiers', () => {
    const snippet = generateSnippet({
      runtimeUrl: 'https://cdn.example/embed.js',
      clientId: 'ck_live_1',
      projectId: 'proj_1',
      environment: 'production',
    });

    expect(snippet).toContain("'wl'");
    expect(snippet).toContain('cid=ck_live_1');
    expect(snippet).toContain('pid=proj_1');
    expect(snippet).toContain('env=production');
  });

  it('parses script URL params and data attributes', () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.example/embed.js?cid=ck_live_1&pid=proj_1&env=staging';
    script.dataset.consent = 'manual';
    script.dataset.namespace = 'demo';

    expect(parseScriptConfig(script)).toMatchObject({
      clientId: 'ck_live_1',
      projectId: 'proj_1',
      environment: 'staging',
      consentMode: 'manual',
      namespace: 'demo',
    });
  });

  it('drains queued commands after auto init', async () => {
    const onComplete = vi.fn();
    window.wl = Object.assign(
      (...args: unknown[]) => {
        window.wl!.q = [...(window.wl!.q ?? []), args as never];
      },
      {
        q: [['on', 'advisor:completed', onComplete] as never],
      },
    );

    const facade = installGlobalEmbed({
      clientId: 'ck_live_1',
      widgets: [],
    });

    expect(facade.runtime).toBeDefined();
    await facade.runtime!.ready();
  });

  it('keeps compatible init idempotent', () => {
    const facade = installGlobalEmbed({
      clientId: 'ck_live_1',
      projectId: 'proj_1',
    });
    const first = facade.runtime;
    const second = facade('init', {
      clientId: 'ck_live_1',
      projectId: 'proj_1',
    });

    expect(second).toBe(first);
    expect(facade.runtime).toBe(first);
  });

  it('reports conflicting init without replacing the runtime', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const facade = installGlobalEmbed({
      clientId: 'ck_live_1',
      debug: true,
    });
    const error = vi.fn();
    facade('on', 'error', error);
    const first = facade.runtime;

    expect(() => facade('init', { clientId: 'ck_live_2' })).not.toThrow();

    expect(facade.runtime).toBe(first);
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ code: 'CONFIG_INVALID' }));
    expect(warn).toHaveBeenCalled();
  });

  it('does not throw synchronously for bad global init config', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const facade = installGlobalEmbed({ namespace: 'wl' });

    expect(() => facade('init', { clientId: 'sk_live_secret' })).not.toThrow();
    expect(facade.runtime).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('SECRET_KEY_REJECTED'),
      expect.objectContaining({ code: 'SECRET_KEY_REJECTED' }),
    );
  });
});
