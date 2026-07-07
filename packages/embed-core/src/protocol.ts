export const EMBED_PROTOCOL_VERSION = 1 as const;
export const DEFAULT_HANDSHAKE_TIMEOUT_MS = 10_000;

export type EmbedMessageKind =
  | 'handshake'
  | 'handshake-ack'
  | 'command'
  | 'event'
  | 'error'
  | 'destroy';

export type EmbedErrorCode =
  | 'INIT_REQUIRED'
  | 'CONFIG_INVALID'
  | 'SECRET_KEY_REJECTED'
  | 'WIDGET_NOT_FOUND'
  | 'PLACEMENT_UNSUPPORTED'
  | 'HANDSHAKE_TIMEOUT'
  | 'ORIGIN_REJECTED'
  | 'CONSENT_REQUIRED'
  | 'LOAD_FAILED'
  | 'DESTROYED'
  | 'PROTOCOL_VERSION_UNSUPPORTED';

export interface EmbedErrorDetails {
  code: EmbedErrorCode;
  message: string;
  cause?: unknown;
  widgetId?: string;
  widgetName?: string;
}

export class EmbedError extends Error {
  readonly code: EmbedErrorCode;
  readonly cause?: unknown;
  readonly widgetId?: string;
  readonly widgetName?: string;

  constructor(details: EmbedErrorDetails) {
    super(details.message);
    this.name = 'EmbedError';
    this.code = details.code;
    this.cause = details.cause;
    this.widgetId = details.widgetId;
    this.widgetName = details.widgetName;
  }
}

export interface EmbedMessage<TPayload = unknown> {
  wl: typeof EMBED_PROTOCOL_VERSION;
  kind: EmbedMessageKind;
  widgetId: string;
  widgetName: string;
  name: string;
  payload?: TPayload;
  ts: number;
  nonce?: string;
}

export interface CreateMessageOptions<TPayload = unknown> {
  kind: EmbedMessageKind;
  widgetId: string;
  widgetName: string;
  name: string;
  payload?: TPayload;
  nonce?: string;
}

export function createEmbedError(
  code: EmbedErrorCode,
  message: string,
  details: Omit<EmbedErrorDetails, 'code' | 'message'> = {},
): EmbedError {
  return new EmbedError({ code, message, ...details });
}

export function createEmbedMessage<TPayload = unknown>(
  options: CreateMessageOptions<TPayload>,
): EmbedMessage<TPayload> {
  return {
    wl: EMBED_PROTOCOL_VERSION,
    kind: options.kind,
    widgetId: options.widgetId,
    widgetName: options.widgetName,
    name: options.name,
    payload: options.payload,
    ts: Date.now(),
    nonce: options.nonce,
  };
}

export function isEmbedMessage(value: unknown): value is EmbedMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.wl === EMBED_PROTOCOL_VERSION &&
    isEmbedMessageKind(value.kind) &&
    typeof value.widgetId === 'string' &&
    typeof value.widgetName === 'string' &&
    typeof value.name === 'string' &&
    typeof value.ts === 'number'
  );
}

export function validateEmbedMessage(value: unknown): EmbedMessage {
  if (!isRecord(value)) {
    throw createEmbedError('CONFIG_INVALID', 'Embed message must be an object.');
  }

  if (value.wl !== EMBED_PROTOCOL_VERSION) {
    throw createEmbedError(
      'PROTOCOL_VERSION_UNSUPPORTED',
      `Unsupported embed protocol version: ${String(value.wl)}.`,
    );
  }

  if (!isEmbedMessage(value)) {
    throw createEmbedError('CONFIG_INVALID', 'Embed message shape is invalid.');
  }

  return value;
}

export function assertAllowedOrigin(actualOrigin: string, expectedOrigin?: string): void {
  if (!expectedOrigin || expectedOrigin === '*') {
    throw createEmbedError('ORIGIN_REJECTED', 'A concrete expected origin is required.');
  }

  if (actualOrigin !== expectedOrigin) {
    throw createEmbedError(
      'ORIGIN_REJECTED',
      `Rejected message from origin "${actualOrigin}". Expected "${expectedOrigin}".`,
    );
  }
}

function isEmbedMessageKind(value: unknown): value is EmbedMessageKind {
  return (
    value === 'handshake' ||
    value === 'handshake-ack' ||
    value === 'command' ||
    value === 'event' ||
    value === 'error' ||
    value === 'destroy'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
