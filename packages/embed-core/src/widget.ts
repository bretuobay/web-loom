import { EventEmitter } from '@web-loom/event-emitter-core';
import { assertAllowedOrigin, createEmbedMessage, isEmbedMessage } from './protocol.js';
import type { EmbedIdentity, WidgetPlacement } from './host.js';

export type WidgetCleanup = () => void;
export type WidgetContainerElement = ShadowRoot | HTMLElement;

export interface WidgetContext {
  config: Readonly<Record<string, unknown>>;
  props: Readonly<Record<string, unknown>>;
  identity?: EmbedIdentity;
  theme?: unknown;
  emit(event: string, payload?: unknown): void;
  onCommand(command: string, handler: (payload: unknown) => void): () => void;
}

export interface WidgetSpec {
  name: string;
  version: string;
  placements: readonly WidgetPlacement[];
  commands?: readonly string[];
  events?: readonly string[];
  storageKeys?: readonly string[];
  mount(container: WidgetContainerElement, ctx: WidgetContext): void | WidgetCleanup;
}

export interface IframeWidgetRuntimeOptions {
  target?: HTMLElement;
  hostOrigin?: string;
  widgetId?: string;
  widgetName?: string;
  onError?: (error: unknown) => void;
}

export interface IframeWidgetRuntime {
  readonly ready: Promise<WidgetContext>;
  emit(event: string, payload?: unknown): void;
  destroy(): void;
}

export function defineWidget<TSpec extends WidgetSpec>(spec: TSpec): TSpec {
  return spec;
}

export function createIframeWidgetRuntime(
  spec: WidgetSpec,
  options: IframeWidgetRuntimeOptions = {},
): IframeWidgetRuntime {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('createIframeWidgetRuntime requires a browser iframe environment.');
  }

  const params = new URLSearchParams(window.location.hash.slice(1));
  const widgetId = options.widgetId ?? params.get('widgetId') ?? spec.name;
  const widgetName = options.widgetName ?? params.get('widgetName') ?? spec.name;
  const hostOrigin = options.hostOrigin ?? params.get('hostOrigin') ?? referrerOrigin();
  const commands = new EventEmitter<Record<string, unknown>>();
  let cleanup: WidgetCleanup | undefined;
  let removeMessageListener: (() => void) | undefined;

  const ready = new Promise<WidgetContext>((resolve, reject) => {
    if (!hostOrigin || hostOrigin === '*') {
      const error = new Error('A concrete host origin is required for iframe widgets.');
      options.onError?.(error);
      reject(error);
      return;
    }
    const allowedHostOrigin = hostOrigin;

    const onMessage = (event: MessageEvent) => {
      try {
        assertAllowedOrigin(event.origin, hostOrigin);
      } catch (error) {
        options.onError?.(error);
        return;
      }

      if (!isEmbedMessage(event.data) || event.data.widgetId !== widgetId) {
        return;
      }

      if (event.data.kind === 'handshake-ack') {
        const payload = event.data.payload as
          | {
              config?: Record<string, unknown>;
              props?: Record<string, unknown>;
              identity?: EmbedIdentity;
              theme?: unknown;
            }
          | undefined;

        const ctx: WidgetContext = {
          config: Object.freeze(payload?.config ?? {}),
          props: Object.freeze(payload?.props ?? {}),
          identity: payload?.identity,
          theme: payload?.theme,
          emit,
          onCommand(command, handler) {
            return commands.on(command, handler);
          },
        };
        const mounted = spec.mount(options.target ?? document.body, ctx);
        cleanup = mounted || undefined;
        resolve(ctx);
        return;
      }

      if (event.data.kind === 'command') {
        commands.emit(event.data.name, event.data.payload);
      }

      if (event.data.kind === 'destroy') {
        teardown();
      }
    };

    window.addEventListener('message', onMessage);
    removeMessageListener = () => window.removeEventListener('message', onMessage);
    post('handshake', 'ready');

    function emit(event: string, payload?: unknown) {
      post('event', event, payload);
    }

    function post(kind: 'handshake' | 'event' | 'error', name: string, payload?: unknown) {
      window.parent.postMessage(
        createEmbedMessage({
          kind,
          widgetId,
          widgetName,
          name,
          payload,
        }),
        allowedHostOrigin,
      );
    }
  });

  return {
    ready,
    emit(event, payload) {
      window.parent.postMessage(
        createEmbedMessage({
          kind: 'event',
          widgetId,
          widgetName,
          name: event,
          payload,
        }),
        hostOrigin ?? '*',
      );
    },
    destroy() {
      teardown();
    },
  };

  function teardown(): void {
    cleanup?.();
    cleanup = undefined;
    commands.off();
    removeMessageListener?.();
    removeMessageListener = undefined;
  }
}

export function isWidgetSpec(value: unknown): value is WidgetSpec {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<WidgetSpec>;
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.version === 'string' &&
    Array.isArray(candidate.placements) &&
    typeof candidate.mount === 'function'
  );
}

function referrerOrigin(): string | undefined {
  if (!document.referrer) {
    return undefined;
  }
  return new URL(document.referrer).origin;
}
