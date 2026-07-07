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

export function defineWidget<TSpec extends WidgetSpec>(spec: TSpec): TSpec {
  return spec;
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
