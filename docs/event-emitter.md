# Event Emitter Core

`@web-loom/event-emitter-core` is the shared event primitive used across Web Loom packages. It replaces the ad-hoc emitters that previously lived in `forms-core`, `storage-core`, `media-core`, `notifications-core`, and even `event-bus-core`.

## Why a shared emitter?

- **Consistent API** – `on`, `once`, `off`, `emit`, `removeAllListeners`, and `subscribe`/`unsubscribe` aliases behave identically everywhere.
- **Typed payloads** – Events are described through a TypeScript map so payloads are enforced at compile time.
- **Robust defaults** – Listener errors are caught and routed to `console.error`, with an escape hatch via `onError`.
- **Tested once** – Comprehensive unit tests live with the package, so feature gaps and regressions are caught centrally.

The emitter is intentionally separate from `@web-loom/event-bus-core`. The bus adds higher-level concepts such as multi-event listeners and argument tuples, but it now delegates the low-level listener bookkeeping to the shared emitter.

## API surface

```ts
type EventMap = {
  ready: void;
  status: { id: string; online: boolean };
  progress: [current: number, total: number];
};

const emitter = new EventEmitter<EventMap>({
  onError(error, eventName) {
    reportToTelemetry(error, eventName);
  },
});

const unsubscribe = emitter.on('status', ({ id, online }) => {
  console.log(`${id} is ${online ? 'green' : 'red'}`);
});

emitter.emit('progress', 12, 90);
emitter.emit('ready');
unsubscribe();
```

### Methods

| Method | Description |
| --- | --- |
| `on(event, listener)` | Register a listener and receive an unsubscribe function. |
| `subscribe(event, listener)` | Alias for `on` (used by legacy packages). |
| `once(event, listener)` | Register a listener that removes itself after the first call. |
| `off(event?, listener?)` | Remove a specific listener, every listener for an event, or everything. |
| `unsubscribe(event, listener?)` | Alias for `off`. |
| `emit(event, ...payload)` | Synchronously invoke listeners with typed payloads. |
| `removeAllListeners(event?)` / `removeAll(event?)` / `clear()` | Clean up listeners. |
| `listenerCount(event)` / `hasListeners(event)` / `eventNames()` | Runtime inspection helpers. |

Errors thrown by listeners are caught; by default we warn via `console.error`. Pass an `onError` callback to centralize reporting.

## Package-specific usage

### `@web-loom/forms-core`

Forms use the emitter to broadcast lifecycle events without coupling form instances to UI frameworks.

```ts
const form = FormFactory.create({
  defaultValues: { email: '' },
  schema,
});

const stop = form.subscribe('fieldChange', ({ path, value }) => {
  console.log(`${path} changed`, value);
});

stop(); // remove fieldChange listener
```

### `@web-loom/storage-core`

Storage publishes `StorageChangeEvent`s under a wildcard channel so subscribers can match keys.

```ts
const unsubscribe = storage.subscribe('users:*', (event) => {
  console.log(event.key, event.newValue);
});

// Behind the scenes:
// this.eventEmitter.emit('*', { key, oldValue, newValue });
```

### `@web-loom/notifications-core`

`NotificationManager` fans out permission changes, notification clicks/closes, and push events.

```ts
const manager = new NotificationManager();
manager.onPermissionChange((state) => console.log('Permission:', state));
```

### `@web-loom/media-core`

`MediaCorePlayer` funnels browser media events and plugin hooks through the emitter (`play`, `pause`, `trackchange`, etc.), enabling React/Vue adapters and plugin authors to subscribe consistently.

```ts
player.on('timeupdate', (snapshot) => progressBar.update(snapshot.currentTime));
```

### `@web-loom/event-bus-core`

The event bus now composes the emitter internally for listener bookkeeping and error handling. Consumers still use the same `eventBus.on/once/off/emit` API, but diagnostics (such as handler failure logging) flow through the shared emitter.

```ts
const eventBus = createEventBus<AppEvents>();
eventBus.on('user:login', (payload) => { ... });
```

## Migration checklist for siblings

- Replace custom emitters with `import { EventEmitter } from '@web-loom/event-emitter-core'`.
- Model events with explicit `EventMap` types (tuples for multi-argument events).
- Remove bespoke logging or cleanup helpers; the shared emitter exposes `removeAllListeners`, `clear`, and `listenerCount`.
- Document the new dependency in each package’s README if it surfaces in the public API.

See `packages/event-emitter-core/README.md` for a shorter, publishable overview.
