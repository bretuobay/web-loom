# @web-loom/event-emitter-core

Type-safe event emitter shared across the Web Loom packages. This utility replaces the ad-hoc emitters that previously lived in `forms-core`, `notifications-core`, `media-core`, and `storage-core`.

## Installation

```bash
npm install @web-loom/event-emitter-core
```

## Quick start

```ts
import { EventEmitter } from '@web-loom/event-emitter-core';

type MediaEvents = {
  play: void;
  progress: [currentTime: number, duration: number];
  error: Error;
};

const emitter = new EventEmitter<MediaEvents>();
const cleanup = emitter.on('progress', (current, total) => {
  console.log(`${current}/${total}`);
});

emitter.emit('progress', 16, 100);
cleanup();
```

### API surface

- `on(event, listener)` – register a listener and get an unsubscribe callback.
- `once(event, listener)` – same as `on` but automatically unsubscribes after the first emission.
- `off(event?, listener?)` – remove a specific listener, all listeners for an event, or everything.
- `emit(event, ...payload)` – synchronously fan out the payload.
- `removeAllListeners(event?)`/`removeAll()`/`clear()` – cleanup helpers.
- `listenerCount(event)`, `hasListeners(event)`, `eventNames()` – runtime inspection helpers.
- `subscribe`/`unsubscribe`/`unsubscribeAll` – compatibility aliases for legacy packages.

Errors thrown by listeners are caught and forwarded to `console.error` by default. Pass `new EventEmitter({ onError })` if you want to override that behavior.

## Package relationships

| Package | Usage |
| --- | --- |
| `@web-loom/forms-core` | Debounced form events and lifecycle hooks. |
| `@web-loom/storage-core` | Key-pattern subscriptions for cross-tab storage updates. |
| `@web-loom/notifications-core` | Permission / push event fan-out. |
| `@web-loom/media-core` | Player lifecycle events (play, pause, lazy loading, plugins). |
| `@web-loom/event-bus-core` | Internal listener bookkeeping for the public bus API. |

See `docs/event-emitter.md` in the repo root for package‑specific integration notes.
