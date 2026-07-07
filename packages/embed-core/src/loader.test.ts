import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateSnippet, installGlobalEmbed, parseScriptConfig } from './loader.js';

describe('loader', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete window.wl;
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
});
