import { EventEmitter } from '@web-loom/event-emitter-core';
import {
  DEFAULT_HANDSHAKE_TIMEOUT_MS,
  type EmbedError,
  type EmbedMessage,
  assertAllowedOrigin,
  createEmbedError,
  createEmbedMessage,
  isEmbedMessage,
} from './protocol.js';
import { isWidgetSpec, type WidgetContext, type WidgetSpec } from './widget.js';

export const EMBED_CORE_VERSION = '0.1.0';

export type EmbedEnvironment = 'development' | 'staging' | 'production';
export type ConsentMode = 'implicit' | 'manual';
export type ConsentState = 'unknown' | 'granted' | 'denied';
export type WidgetPlacement = 'inline' | 'modal' | 'launcher';
export type WidgetContainer = 'shadow' | 'iframe' | 'auto';
export type WidgetState = 'idle' | 'loading' | 'mounted' | 'open' | 'closed' | 'destroyed' | 'error';

export interface EmbedIdentity {
  userId?: string;
  traits?: Record<string, unknown>;
  organizationId?: string;
  tenantId?: string;
  workspaceId?: string;
}

export interface WidgetRegistryEntry {
  name: string;
  version?: string;
  url?: string;
  module?: () => Promise<WidgetSpec | { default: WidgetSpec }> | WidgetSpec | { default: WidgetSpec };
  origin?: string;
  placements: WidgetPlacement[];
  defaultPlacement?: WidgetPlacement;
  container?: WidgetContainer;
  propsSchema?: unknown;
}

export interface RemoteEmbedConfig {
  disabled?: boolean;
  widgets?: WidgetRegistryEntry[];
  theme?: unknown;
  locale?: string;
  metadata?: Record<string, unknown>;
  runtimeUrl?: string;
}

export interface EmbedConfig {
  clientId: string;
  projectId?: string;
  environment?: EmbedEnvironment;
  namespace?: string;
  configEndpoint?: string;
  runtimeUrl?: string;
  consentMode?: ConsentMode;
  debug?: boolean;
  theme?: unknown;
  locale?: string;
  identity?: EmbedIdentity;
  metadata?: Record<string, unknown>;
  widgets?: WidgetRegistryEntry[];
  fetchRemoteConfig?: typeof fetch;
}

export interface ResolvedEmbedConfig extends Omit<EmbedConfig, 'fetchRemoteConfig'> {
  consentMode: ConsentMode;
  environment: EmbedEnvironment;
  namespace: string;
  widgets: WidgetRegistryEntry[];
  disabled: boolean;
}

export interface MountOptions {
  placement?: WidgetPlacement;
  props?: Record<string, unknown>;
  target?: string | HTMLElement;
  container?: WidgetContainer;
  widgetUrl?: string;
}

export interface WidgetHandle {
  id: string;
  name: string;
  placement: WidgetPlacement;
  readonly state: WidgetState;
  send(command: string, payload?: unknown): void;
  on(event: string, callback: (payload: unknown) => void): () => void;
  off(event: string, callback?: (payload: unknown) => void): void;
  once(event: string, callback: (payload: unknown) => void): () => void;
  open(): void;
  close(): void;
  destroy(): void;
}

export interface EmbedRuntime {
  readonly version: string;
  readonly config: ResolvedEmbedConfig;
  ready(): Promise<void>;
  mount(name: string, target?: string | HTMLElement, options?: MountOptions): Promise<WidgetHandle>;
  open(name: string, options?: MountOptions): Promise<WidgetHandle>;
  close(nameOrId?: string): void;
  destroy(nameOrId?: string): void;
  send(nameOrId: string, command: string, payload?: unknown): void;
  on(event: string, callback: (payload: unknown) => void): () => void;
  off(event: string, callback?: (payload: unknown) => void): void;
  once(event: string, callback: (payload: unknown) => void): () => void;
  identify(identity: EmbedIdentity): void;
  consent(state: Exclude<ConsentState, 'unknown'>): void;
  register(entry: WidgetRegistryEntry): void;
  scan(root?: ParentNode): void;
  defineCustomElement(): void;
}

export interface CspDirectives {
  'script-src': string[];
  'connect-src': string[];
  'frame-src': string[];
}

interface RuntimeEvents extends Record<PropertyKey, unknown> {
  error: EmbedError;
  [eventName: string]: unknown;
}

interface InternalHandle extends WidgetHandle {
  entry: WidgetRegistryEntry;
  element: HTMLElement;
  cleanup?: () => void;
  commands: EventEmitter<Record<string, unknown>>;
  markState(state: WidgetState): void;
  emitLocal(event: string, payload: unknown): void;
}

export function createEmbed(config: EmbedConfig): EmbedRuntime {
  assertBrowserSafeConfig(config);

  const emitter = new EventEmitter<RuntimeEvents>();
  const registry = new Map<string, WidgetRegistryEntry>();
  const handles = new Map<string, InternalHandle>();
  let identity = config.identity;
  let consentState: ConsentState = config.consentMode === 'manual' ? 'unknown' : 'granted';
  let destroyed = false;
  let observer: MutationObserver | undefined;
  let scanScheduled = false;
  const pendingScanRoots = new Set<ParentNode>();

  const resolved: ResolvedEmbedConfig = {
    ...config,
    clientId: config.clientId,
    projectId: config.projectId,
    environment: config.environment ?? 'production',
    namespace: config.namespace ?? 'wl',
    consentMode: config.consentMode ?? 'implicit',
    widgets: config.widgets ? [...config.widgets] : [],
    disabled: false,
  };

  for (const entry of resolved.widgets) {
    registry.set(entry.name, entry);
  }

  const readyPromise = resolveRemoteConfig(config, resolved)
    .then((remote) => {
      if (!remote) {
        return;
      }

      resolved.disabled = remote.disabled === true;
      resolved.theme = resolved.theme ?? remote.theme;
      resolved.locale = resolved.locale ?? remote.locale;
      resolved.metadata = { ...remote.metadata, ...resolved.metadata };
      resolved.runtimeUrl = resolved.runtimeUrl ?? remote.runtimeUrl;

      for (const entry of remote.widgets ?? []) {
        registry.set(entry.name, entry);
      }
      for (const entry of config.widgets ?? []) {
        registry.set(entry.name, entry);
      }
      resolved.widgets = Array.from(registry.values());
    })
    .catch((cause: unknown) => {
      emitError(createEmbedError('LOAD_FAILED', 'Remote embed config failed to load.', { cause }));
    });

  const runtime: EmbedRuntime = {
    version: EMBED_CORE_VERSION,
    config: resolved,
    ready: () => readyPromise,
    mount,
    open,
    close,
    destroy,
    send,
    on: (event, callback) => emitter.on(event, callback),
    off: (event, callback) => emitter.off(event, callback),
    once: (event, callback) => emitter.once(event, callback),
    identify(nextIdentity) {
      identity = nextIdentity;
    },
    consent(state) {
      consentState = state;
      if (state === 'denied') {
        teardownWidgets();
      }
    },
    register(entry) {
      registry.set(entry.name, entry);
      resolved.widgets = Array.from(registry.values());
    },
    scan(root) {
      scheduleScan(root ?? document);
    },
    defineCustomElement: () => defineWidgetElement(runtime),
  };
  Object.assign(runtime, { __emitError: emitError });

  return runtime;

  async function mount(name: string, target?: string | HTMLElement, options: MountOptions = {}): Promise<WidgetHandle> {
    await readyPromise;
    assertUsable();
    assertConsent();

    const entry = registry.get(name);
    if (!entry) {
      throwAndEmit(createEmbedError('WIDGET_NOT_FOUND', `Widget "${name}" is not registered.`, { widgetName: name }));
    }

    const placement = options.placement ?? entry.defaultPlacement ?? entry.placements[0] ?? 'inline';
    if (!entry.placements.includes(placement)) {
      throwAndEmit(
        createEmbedError('PLACEMENT_UNSUPPORTED', `Widget "${name}" does not support "${placement}".`, {
          widgetName: name,
        }),
      );
    }

    const id = createWidgetId(name);
    const container =
      options.container === 'auto' || !options.container ? chooseContainer(entry, placement) : options.container;
    const element = createHostElement(placement, target ?? options.target);
    const handle = createHandle(id, name, placement, entry, element);
    handles.set(id, handle);
    handle.markState('loading');

    try {
      if (container === 'iframe') {
        mountIframe(handle, options);
      } else {
        await mountShadow(handle, options);
      }
      handle.markState('open');
      return handle;
    } catch (cause) {
      handle.markState('error');
      handle.destroy();
      throwAndEmit(
        createEmbedError('LOAD_FAILED', `Widget "${name}" failed to mount.`, { cause, widgetId: id, widgetName: name }),
      );
    }
  }

  async function open(name: string, options: MountOptions = {}): Promise<WidgetHandle> {
    const existing = findHandle(name);
    if (existing) {
      existing.open();
      return existing;
    }

    return mount(name, options.target, {
      ...options,
      placement: options.placement ?? 'modal',
    });
  }

  function close(nameOrId?: string): void {
    forEachHandle(nameOrId, (handle) => handle.close());
  }

  function destroy(nameOrId?: string): void {
    if (!nameOrId) {
      observer?.disconnect();
      observer = undefined;
    }
    forEachHandle(nameOrId, (handle) => handle.destroy());
    if (!nameOrId) {
      destroyed = true;
      emitter.off();
    }
  }

  function teardownWidgets(): void {
    forEachHandle(undefined, (handle) => handle.destroy());
  }

  function send(nameOrId: string, command: string, payload?: unknown): void {
    const handle = findHandle(nameOrId);
    if (!handle) {
      emitError(createEmbedError('WIDGET_NOT_FOUND', `Widget handle "${nameOrId}" was not found.`));
      return;
    }
    handle.send(command, payload);
  }

  function scanNow(root: ParentNode = document): void {
    if (!isBrowser()) {
      return;
    }

    for (const node of queryWithRoot(root, '[data-wl-widget]')) {
      if (node.dataset.wlMounted === 'true') {
        continue;
      }
      const name = node.dataset.wlWidget;
      if (!name) {
        continue;
      }
      node.dataset.wlMounted = 'true';
      void mount(name, node, {
        placement: parsePlacement(node.dataset.wlPlacement),
        props: collectDataProps(node),
      });
    }

    for (const trigger of queryWithRoot(root, '[data-wl-open]')) {
      if (trigger.dataset.wlTriggerMounted === 'true') {
        continue;
      }
      trigger.dataset.wlTriggerMounted = 'true';
      trigger.addEventListener('click', () => {
        const name = trigger.dataset.wlOpen;
        if (name) {
          void open(name, { placement: parsePlacement(trigger.dataset.wlPlacement) });
        }
      });
    }

    if (!observer && root === document && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of Array.from(record.addedNodes)) {
            if (node instanceof HTMLElement) {
              scheduleScan(node);
            }
          }
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  function scheduleScan(root: ParentNode): void {
    if (!isBrowser()) {
      return;
    }

    pendingScanRoots.add(root);
    if (scanScheduled) {
      return;
    }
    scanScheduled = true;
    scheduleIdle(() => {
      scanScheduled = false;
      const roots = Array.from(pendingScanRoots);
      pendingScanRoots.clear();
      for (const pendingRoot of roots) {
        scanNow(pendingRoot);
      }
    });
  }

  async function mountShadow(handle: InternalHandle, options: MountOptions): Promise<void> {
    const spec = await loadWidgetSpec(handle.entry);
    const shadow = handle.element.attachShadow({ mode: 'open' });
    const ctx = createWidgetContext(handle, options.props ?? {});
    const cleanup = spec.mount(shadow, ctx);
    if (resolved.debug && spec.storageKeys?.length && !cleanup) {
      console.warn(`[embed-core] Widget "${spec.name}" declares storageKeys but did not return a cleanup function.`);
    }
    handle.cleanup = cleanup || undefined;
    handle.markState('mounted');
  }

  function mountIframe(handle: InternalHandle, options: MountOptions): void {
    const widgetUrl = options.widgetUrl ?? handle.entry.url;
    if (!widgetUrl) {
      throw createEmbedError('LOAD_FAILED', `Widget "${handle.name}" does not declare an iframe URL.`, {
        widgetId: handle.id,
        widgetName: handle.name,
      });
    }

    const iframe = document.createElement('iframe');
    iframe.title = `${handle.name} widget`;
    iframe.src = createIframeUrl(widgetUrl, handle);
    iframe.style.border = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    handle.element.append(iframe);

    let handshakeComplete = false;
    const queued: EmbedMessage[] = [];
    const expectedOrigin = handle.entry.origin ?? new URL(widgetUrl, window.location.href).origin;
    const timeout = window.setTimeout(() => {
      if (!handshakeComplete) {
        emitError(
          createEmbedError('HANDSHAKE_TIMEOUT', `Widget "${handle.name}" did not complete handshake.`, {
            widgetId: handle.id,
            widgetName: handle.name,
          }),
        );
      }
    }, DEFAULT_HANDSHAKE_TIMEOUT_MS);

    const post = (message: EmbedMessage) => {
      if (!iframe.contentWindow) {
        return;
      }
      if (!handshakeComplete && message.kind === 'command') {
        queued.push(message);
        return;
      }
      iframe.contentWindow.postMessage(message, expectedOrigin);
    };

    const onMessage = (event: MessageEvent) => {
      try {
        assertAllowedOrigin(event.origin, expectedOrigin);
      } catch (error) {
        emitError(error as EmbedError);
        return;
      }

      if (!isEmbedMessage(event.data) || event.data.widgetId !== handle.id) {
        return;
      }

      if (event.data.kind === 'handshake') {
        handshakeComplete = true;
        window.clearTimeout(timeout);
        post(
          createEmbedMessage({
            kind: 'handshake-ack',
            widgetId: handle.id,
            widgetName: handle.name,
            name: 'ready',
            payload: {
              config: safeConfigForWidget(),
              props: options.props ?? {},
              theme: resolved.theme,
              identity,
            },
          }),
        );
        for (const message of queued.splice(0)) {
          post(message);
        }
        handle.markState('mounted');
        return;
      }

      if (event.data.kind === 'event') {
        emitWidgetEvent(handle, event.data.name, event.data.payload);
      }
      if (event.data.kind === 'error') {
        emitError(
          createEmbedError('LOAD_FAILED', String(event.data.payload ?? event.data.name), {
            widgetId: handle.id,
            widgetName: handle.name,
          }),
        );
      }
    };

    window.addEventListener('message', onMessage);
    const originalSend = handle.send;
    handle.send = (command, payload) => {
      originalSend(command, payload);
      post(
        createEmbedMessage({
          kind: 'command',
          widgetId: handle.id,
          widgetName: handle.name,
          name: command,
          payload,
        }),
      );
    };
    handle.cleanup = () => {
      window.clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
    };
    handle.markState('mounted');
  }

  function createHandle(
    id: string,
    name: string,
    placement: WidgetPlacement,
    entry: WidgetRegistryEntry,
    element: HTMLElement,
  ): InternalHandle {
    let state: WidgetState = 'idle';
    const commands = new EventEmitter<Record<string, unknown>>();
    const localEvents = new EventEmitter<Record<string, unknown>>();
    const handle: InternalHandle = {
      id,
      name,
      placement,
      entry,
      element,
      commands,
      get state() {
        return state;
      },
      markState(nextState) {
        state = nextState;
      },
      emitLocal(event, payload) {
        localEvents.emit(event, payload);
      },
      send(command, payload) {
        commands.emit(command, payload);
      },
      on(event, callback) {
        return localEvents.on(event, callback);
      },
      off(event, callback) {
        localEvents.off(event, callback);
      },
      once(event, callback) {
        return localEvents.once(event, callback);
      },
      open() {
        if (state === 'destroyed') {
          emitError(
            createEmbedError('DESTROYED', `Widget "${name}" has been destroyed.`, { widgetId: id, widgetName: name }),
          );
          return;
        }
        element.hidden = false;
        state = 'open';
      },
      close() {
        if (state === 'destroyed') {
          return;
        }
        element.hidden = true;
        state = 'closed';
      },
      destroy() {
        if (state === 'destroyed') {
          return;
        }
        handle.cleanup?.();
        commands.off();
        localEvents.off();
        element.remove();
        state = 'destroyed';
        handles.delete(id);
      },
    };

    return handle;
  }

  function createWidgetContext(handle: InternalHandle, props: Record<string, unknown>): WidgetContext {
    return {
      config: safeConfigForWidget(),
      props,
      identity,
      theme: resolved.theme,
      emit(event, payload) {
        emitWidgetEvent(handle, event, payload);
      },
      onCommand(command, handler) {
        return handle.commands.on(command, handler);
      },
    };
  }

  function emitWidgetEvent(handle: InternalHandle, event: string, payload: unknown): void {
    handle.emitLocal(event, payload);
    emitter.emit(`${handle.name}:${event}`, payload);
    emitter.emit(event, payload);
    handle.element.dispatchEvent(
      new CustomEvent(`wl:${event}`, {
        detail: payload,
        bubbles: true,
        composed: true,
      }),
    );
  }

  function emitError(error: EmbedError): void {
    if (resolved.debug) {
      console.warn(`[embed-core] ${error.code}: ${error.message}`, error);
    }
    emitter.emit('error', error);
  }

  function throwAndEmit(error: EmbedError): never {
    emitError(error);
    throw error;
  }

  function assertUsable(): void {
    if (destroyed) {
      throwAndEmit(createEmbedError('DESTROYED', 'Embed runtime has been destroyed.'));
    }
    if (resolved.disabled) {
      throwAndEmit(createEmbedError('LOAD_FAILED', 'Embed runtime is disabled by remote config.'));
    }
  }

  function assertConsent(): void {
    if (resolved.consentMode === 'manual' && consentState !== 'granted') {
      throwAndEmit(createEmbedError('CONSENT_REQUIRED', 'Consent is required before loading widgets.'));
    }
  }

  function findHandle(nameOrId: string): InternalHandle | undefined {
    return handles.get(nameOrId) ?? Array.from(handles.values()).find((handle) => handle.name === nameOrId);
  }

  function forEachHandle(nameOrId: string | undefined, callback: (handle: InternalHandle) => void): void {
    const selected = nameOrId
      ? [findHandle(nameOrId)].filter((handle): handle is InternalHandle => Boolean(handle))
      : Array.from(handles.values());
    for (const handle of selected) {
      callback(handle);
    }
  }

  function safeConfigForWidget(): Readonly<Record<string, unknown>> {
    return Object.freeze({
      clientId: resolved.clientId,
      projectId: resolved.projectId,
      environment: resolved.environment,
      locale: resolved.locale,
      metadata: resolved.metadata,
    });
  }
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function collectDataProps(node: HTMLElement): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node.dataset)) {
    if (!key.startsWith('wlProp')) {
      continue;
    }
    const propName = key.slice('wlProp'.length);
    if (!propName) {
      continue;
    }
    props[propName.charAt(0).toLowerCase() + propName.slice(1)] = value;
  }
  return props;
}

export function parsePlacement(value: string | undefined): WidgetPlacement | undefined {
  if (value === 'inline' || value === 'modal' || value === 'launcher') {
    return value;
  }
  return undefined;
}

export function createCspDirectives(
  config: Pick<EmbedConfig, 'runtimeUrl' | 'configEndpoint' | 'widgets'>,
): CspDirectives {
  const scriptSrc = new Set<string>();
  const connectSrc = new Set<string>();
  const frameSrc = new Set<string>();

  addOrigin(scriptSrc, config.runtimeUrl);
  addOrigin(connectSrc, config.configEndpoint);
  for (const widget of config.widgets ?? []) {
    if (widget.url) {
      addOrigin(frameSrc, widget.url);
    }
    if (widget.origin) {
      frameSrc.add(widget.origin);
    }
  }

  return {
    'script-src': Array.from(scriptSrc),
    'connect-src': Array.from(connectSrc),
    'frame-src': Array.from(frameSrc),
  };
}

function assertBrowserSafeConfig(config: EmbedConfig): void {
  if (!config.clientId) {
    throw createEmbedError('CONFIG_INVALID', 'clientId is required.');
  }

  const credentialValues = [
    config.clientId,
    credentialField(config, 'apiKey'),
    credentialField(config, 'accessToken'),
    credentialField(config, 'token'),
    credentialField(config, 'secretKey'),
    credentialField(config, 'publishableKey'),
  ].filter((value): value is string => typeof value === 'string');

  if (credentialValues.some(isSecretLikeValue)) {
    throw createEmbedError('SECRET_KEY_REJECTED', 'Secret keys must not be passed to embed-core browser config.');
  }
}

function credentialField(config: EmbedConfig, key: string): unknown {
  return (config as EmbedConfig & Record<string, unknown>)[key];
}

function isSecretLikeValue(value: string): boolean {
  return /^sk($|_)/i.test(value);
}

async function resolveRemoteConfig(
  config: EmbedConfig,
  resolved: ResolvedEmbedConfig,
): Promise<RemoteEmbedConfig | undefined> {
  if (!config.configEndpoint) {
    return undefined;
  }

  const fetcher = config.fetchRemoteConfig ?? (isBrowser() ? window.fetch.bind(window) : undefined);
  if (!fetcher) {
    return undefined;
  }

  const url = new URL(config.configEndpoint, isBrowser() ? window.location.href : 'http://localhost');
  url.searchParams.set('cid', resolved.clientId);
  if (resolved.projectId) {
    url.searchParams.set('pid', resolved.projectId);
  }
  if (isBrowser()) {
    url.searchParams.set('origin', window.location.origin);
  }

  const response = await fetcher(url.toString());
  if (!response.ok) {
    throw createEmbedError('LOAD_FAILED', `Remote config returned ${response.status}.`);
  }

  return (await response.json()) as RemoteEmbedConfig;
}

async function loadWidgetSpec(entry: WidgetRegistryEntry): Promise<WidgetSpec> {
  if (!entry.module) {
    throw createEmbedError('LOAD_FAILED', `Widget "${entry.name}" does not declare a module loader.`, {
      widgetName: entry.name,
    });
  }

  const loaded = await entry.module();
  const spec = isWidgetSpec(loaded) ? loaded : loaded.default;
  if (!isWidgetSpec(spec)) {
    throw createEmbedError('LOAD_FAILED', `Widget "${entry.name}" module did not export a widget spec.`, {
      widgetName: entry.name,
    });
  }

  return spec;
}

function chooseContainer(entry: WidgetRegistryEntry, placement: WidgetPlacement): Exclude<WidgetContainer, 'auto'> {
  if (entry.container && entry.container !== 'auto') {
    return entry.container;
  }
  if (placement === 'inline') {
    return 'shadow';
  }
  return 'iframe';
}

function createHostElement(placement: WidgetPlacement, target?: string | HTMLElement): HTMLElement {
  if (!isBrowser()) {
    throw createEmbedError('INIT_REQUIRED', 'A browser environment is required to mount widgets.');
  }

  const resolvedTarget = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (placement === 'inline') {
    if (!resolvedTarget) {
      throw createEmbedError('CONFIG_INVALID', 'Inline widgets require a target element.');
    }
    const host = document.createElement('div');
    host.dataset.wlPlacement = placement;
    host.dataset.wlHost = 'inline';
    resolvedTarget.append(host);
    return host;
  }

  const host = document.createElement('div');
  host.dataset.wlPlacement = placement;
  Object.assign(host.style, placement === 'launcher' ? launcherStyles() : modalStyles());
  document.body.append(host);
  return host;
}

function modalStyles(): Partial<CSSStyleDeclaration> {
  return {
    position: 'fixed',
    inset: '0',
    zIndex: '2147483000',
    width: '100%',
    height: '100%',
  };
}

function launcherStyles(): Partial<CSSStyleDeclaration> {
  return {
    position: 'fixed',
    right: '24px',
    bottom: '24px',
    zIndex: '2147483000',
    width: '420px',
    height: '640px',
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: 'calc(100vh - 32px)',
  };
}

function createIframeUrl(url: string, handle: WidgetHandle): string {
  const iframeUrl = new URL(url, window.location.href);
  iframeUrl.hash = new URLSearchParams({
    widgetId: handle.id,
    widgetName: handle.name,
    hostOrigin: window.location.origin,
  }).toString();
  return iframeUrl.toString();
}

function createWidgetId(name: string): string {
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${name}-${suffix}`;
}

function defineWidgetElement(runtime: EmbedRuntime): void {
  if (!isBrowser() || !('customElements' in window) || customElements.get('wl-widget')) {
    return;
  }

  class WebLoomWidgetElement extends HTMLElement {
    private handle?: WidgetHandle;

    static get observedAttributes() {
      return ['name', 'placement'];
    }

    connectedCallback() {
      void this.mountWidget();
    }

    disconnectedCallback() {
      this.handle?.destroy();
      this.handle = undefined;
    }

    attributeChangedCallback() {
      if (this.isConnected) {
        void this.mountWidget();
      }
    }

    send(command: string, payload?: unknown) {
      this.handle?.send(command, payload);
    }

    open() {
      this.handle?.open();
    }

    close() {
      this.handle?.close();
    }

    destroy() {
      this.handle?.destroy();
      this.handle = undefined;
    }

    private async mountWidget() {
      const name = this.getAttribute('name');
      if (!name) {
        return;
      }
      this.handle?.destroy();
      this.handle = await runtime.mount(name, this, {
        placement: parsePlacement(this.getAttribute('placement') ?? undefined) ?? 'inline',
        props: collectElementProps(this),
      });
    }
  }

  customElements.define('wl-widget', WebLoomWidgetElement);
}

function collectElementProps(element: HTMLElement): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const attribute of Array.from(element.attributes)) {
    if (attribute.name === 'name' || attribute.name === 'placement') {
      continue;
    }
    props[kebabToCamel(attribute.name)] = attribute.value;
  }
  return props;
}

function kebabToCamel(value: string): string {
  return value.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

function addOrigin(target: Set<string>, value: string | undefined): void {
  if (!value) {
    return;
  }

  target.add(new URL(value, isBrowser() ? window.location.href : 'http://localhost').origin);
}

function queryWithRoot(root: ParentNode, selector: string): HTMLElement[] {
  const matches: HTMLElement[] = [];
  if (root instanceof HTMLElement && root.matches(selector)) {
    matches.push(root);
  }
  matches.push(...Array.from(root.querySelectorAll<HTMLElement>(selector)));
  return matches;
}

function scheduleIdle(callback: () => void): void {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(callback);
    return;
  }
  window.setTimeout(callback, 0);
}
