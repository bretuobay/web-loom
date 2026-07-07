import type { EmbedMessage } from './protocol.js';

export interface FakeTransport {
  sent: EmbedMessage[];
  send(message: EmbedMessage): void;
  clear(): void;
}

export function createFakeTransport(): FakeTransport {
  return {
    sent: [],
    send(message) {
      this.sent.push(message);
    },
    clear() {
      this.sent.length = 0;
    },
  };
}
