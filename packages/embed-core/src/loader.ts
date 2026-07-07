import { createEmbed, type EmbedConfig, type EmbedRuntime, type MountOptions } from './host.js';

export type GlobalCommandName =
  | 'init'
  | 'ready'
  | 'mount'
  | 'open'
  | 'close'
  | 'destroy'
  | 'send'
  | 'on'
  | 'off'
  | 'once'
  | 'identify'
  | 'consent';

export type GlobalCommand = [GlobalCommandName, ...unknown[]];

export interface SnippetOptions {
  namespace?: string;
  runtimeUrl: string;
  clientId?: string;
  projectId?: string;
  environment?: string;
}

export interface LoaderConfig {
  namespace: string;
  runtimeUrl?: string;
  clientId?: string;
  projectId?: string;
  environment?: string;
  consentMode?: 'implicit' | 'manual';
}

export interface GlobalEmbedFacade {
  (...command: GlobalCommand): unknown;
  q?: GlobalCommand[];
  l?: number;
  runtime?: EmbedRuntime;
}

declare global {
  interface Window {
    wl?: GlobalEmbedFacade;
  }
}

export function generateSnippet(options: SnippetOptions): string {
  const namespace = options.namespace ?? 'wl';
  const runtimeUrl = withQuery(options.runtimeUrl, {
    cid: options.clientId,
    pid: options.projectId,
    env: options.environment,
  });

  return `<script>
(function(w,d,s,n,u){w[n]=w[n]||function(){(w[n].q=w[n].q||[]).push(arguments)};
w[n].l=+new Date;var e=d.createElement(s);e.async=1;e.src=u;
d.getElementsByTagName(s)[0].parentNode.insertBefore(e,d.getElementsByTagName(s)[0]);
})(window,document,'script','${escapeJs(namespace)}','${escapeJs(runtimeUrl)}');
</script>`;
}

export function parseScriptConfig(script: HTMLScriptElement | null = currentScript()): Partial<EmbedConfig> {
  if (!script) {
    return {};
  }

  const config: Partial<EmbedConfig> = {};
  const src = script.getAttribute('src');
  if (src) {
    const url = new URL(src, window.location.href);
    config.clientId = url.searchParams.get('cid') ?? url.searchParams.get('clientId') ?? undefined;
    config.projectId = url.searchParams.get('pid') ?? url.searchParams.get('projectId') ?? undefined;
    config.environment = parseEnvironment(url.searchParams.get('env') ?? url.searchParams.get('environment'));
    config.runtimeUrl = src;
  }

  config.clientId = script.dataset.clientId ?? script.dataset.client ?? config.clientId;
  config.projectId = script.dataset.projectId ?? script.dataset.project ?? config.projectId;
  config.environment = parseEnvironment(script.dataset.env ?? script.dataset.environment) ?? config.environment;
  config.consentMode = parseConsentMode(script.dataset.consent) ?? config.consentMode;
  config.namespace = script.dataset.namespace ?? config.namespace;
  config.configEndpoint = script.dataset.configEndpoint ?? config.configEndpoint;

  return dropUndefined(config);
}

export function installGlobalEmbed(initialConfig: Partial<EmbedConfig> = parseScriptConfig()): GlobalEmbedFacade {
  const namespace = initialConfig.namespace ?? 'wl';
  const globalObject = window as unknown as Window & Record<string, GlobalEmbedFacade | undefined>;
  const existing = globalObject[namespace];
  const queued = existing?.q ? [...existing.q] : [];
  const pending: GlobalCommand[] = [];
  const readyCallbacks: Array<(runtime: EmbedRuntime) => void> = [];
  let runtime: EmbedRuntime | undefined;

  const facade: GlobalEmbedFacade = (...command) => {
    const [name, ...args] = command;
    if (name === 'init') {
      runtime = createEmbed({
        ...initialConfig,
        ...(args[0] as Partial<EmbedConfig>),
        namespace,
      } as EmbedConfig);
      facade.runtime = runtime;
      runtime.defineCustomElement();
      runtime.scan();
      for (const callback of readyCallbacks.splice(0)) {
        callback(runtime);
      }
      drainPending();
      return runtime;
    }

    if (!runtime) {
      if (name === 'ready' && typeof args[0] === 'function') {
        readyCallbacks.push(args[0] as (runtime: EmbedRuntime) => void);
      } else {
        pending.push(command);
      }
      return undefined;
    }

    return executeCommand(runtime, command);
  };

  facade.q = [];
  facade.l = existing?.l ?? Date.now();
  globalObject[namespace] = facade;

  if (initialConfig.clientId) {
    facade('init', initialConfig);
  }

  for (const command of queued) {
    facade(...command);
  }

  return facade;

  function drainPending(): void {
    if (!runtime) {
      return;
    }
    for (const command of pending.splice(0)) {
      executeCommand(runtime, command);
    }
  }
}

export function executeCommand(runtime: EmbedRuntime, command: GlobalCommand): unknown {
  const [name, ...args] = command;
  switch (name) {
    case 'ready':
      return typeof args[0] === 'function' ? runtime.ready().then(() => (args[0] as () => void)()) : runtime.ready();
    case 'mount':
      return runtime.mount(String(args[0]), args[1] as string | HTMLElement | undefined, args[2] as MountOptions | undefined);
    case 'open':
      return runtime.open(String(args[0]), args[1] as MountOptions | undefined);
    case 'close':
      return runtime.close(args[0] as string | undefined);
    case 'destroy':
      return runtime.destroy(args[0] as string | undefined);
    case 'send':
      return runtime.send(String(args[0]), String(args[1]), args[2]);
    case 'on':
      return runtime.on(String(args[0]), args[1] as (payload: unknown) => void);
    case 'off':
      return runtime.off(String(args[0]), args[1] as ((payload: unknown) => void) | undefined);
    case 'once':
      return runtime.once(String(args[0]), args[1] as (payload: unknown) => void);
    case 'identify':
      return runtime.identify(args[0] as Parameters<EmbedRuntime['identify']>[0]);
    case 'consent':
      return runtime.consent(args[0] as Parameters<EmbedRuntime['consent']>[0]);
    case 'init':
      return runtime;
    default:
      return undefined;
  }
}

function currentScript(): HTMLScriptElement | null {
  if (typeof document === 'undefined') {
    return null;
  }
  return document.currentScript instanceof HTMLScriptElement ? document.currentScript : null;
}

function withQuery(baseUrl: string, query: Record<string, string | undefined>): string {
  const url = new URL(baseUrl, typeof window === 'undefined' ? 'https://example.invalid' : window.location.href);
  for (const [key, value] of Object.entries(query)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function parseEnvironment(value: string | undefined | null): EmbedConfig['environment'] | undefined {
  if (value === 'development' || value === 'staging' || value === 'production') {
    return value;
  }
  return undefined;
}

function parseConsentMode(value: string | undefined): EmbedConfig['consentMode'] | undefined {
  if (value === 'manual' || value === 'implicit') {
    return value;
  }
  return undefined;
}

function dropUndefined<T extends Record<string, unknown>>(value: T): T {
  for (const key of Object.keys(value)) {
    if (value[key] === undefined) {
      delete value[key];
    }
  }
  return value;
}

function escapeJs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
