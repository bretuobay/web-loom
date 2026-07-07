import { describe, expect, it } from 'vitest';
import {
  EMBED_PROTOCOL_VERSION,
  EmbedError,
  assertAllowedOrigin,
  createEmbedError,
  createEmbedMessage,
  isEmbedMessage,
  validateEmbedMessage,
} from './protocol.js';

describe('protocol', () => {
  it('creates and validates protocol messages', () => {
    const message = createEmbedMessage({
      kind: 'event',
      widgetId: 'advisor-1',
      widgetName: 'advisor',
      name: 'completed',
      payload: { ok: true },
    });

    expect(message.wl).toBe(EMBED_PROTOCOL_VERSION);
    expect(isEmbedMessage(message)).toBe(true);
    expect(validateEmbedMessage(message)).toBe(message);
  });

  it('rejects unsupported protocol versions', () => {
    expect(() => validateEmbedMessage({ wl: 2 })).toThrow(EmbedError);
  });

  it('creates typed errors', () => {
    const error = createEmbedError('WIDGET_NOT_FOUND', 'Missing widget', {
      widgetName: 'advisor',
    });

    expect(error.code).toBe('WIDGET_NOT_FOUND');
    expect(error.widgetName).toBe('advisor');
  });

  it('requires exact origins', () => {
    expect(() => assertAllowedOrigin('https://widgets.example', 'https://widgets.example')).not.toThrow();
    expect(() => assertAllowedOrigin('https://evil.example', 'https://widgets.example')).toThrow(EmbedError);
    expect(() => assertAllowedOrigin('https://widgets.example', '*')).toThrow(EmbedError);
  });
});
