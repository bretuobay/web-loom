# @web-loom/media-core Architecture Spec

This document codifies the foundational architecture for the `@web-loom/media-core` library so that subsequent tasks have a consistent technical target. It distills the PRD into actionable layers, contracts, and flows that the implementation can follow.

## System Overview

The media core is intentionally split into distinct layers so it can stay framework-agnostic while still providing hooks for UI, plugins, and adapters.

| Layer              | Responsibility                                                                                                                                                | Notes                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Media Engine       | Pure logic/state orchestration plus media-element lifecycle. Owns playback commands, source negotiation, event normalization, and plugin host lifecycle.      | Runs without assuming a DOM until bound; can be reused in workers/tests.                        |
| DOM Bindings       | Concrete bindings to `<video>`, `<audio>`, and `<img>` elements. Responsible for element creation, attr syncing, event wiring, resize observers, and cleanup. | Exposes a tiny adapter surface so alternate render targets (e.g., React refs) can be supported. |
| UI Shell & Themes  | Optional minimal controls implemented as plugins. They consume the Media Engine API and emit DOM via CSS variables for theming.                               | Ships separately to keep the core headless by default.                                          |
| Framework Adapters | React/Vue/Svelte/Angular wrappers that translate framework lifecycle (mount/unmount, refs, hooks/stores) into Media Engine commands.                          | No framework-specific code leaks back into the core package.                                    |

The layers communicate strictly via TypeScript interfaces (`MediaPlayer`, `MediaPlugin`, etc.). Plugins never reach into DOM bindings directly; they interact through the player API and the event emitter so they can run in any adapter context.

## Component Responsibilities

1. **Core Media Engine**
   - Holds canonical player state (`PlaybackState`, `MediaModeState`).
   - Normalizes events to the typed `MediaEventMap`.
   - Exposes lifecycle hooks (`mount`, `ready`, `dispose`) and playback commands.
   - Manages plugin registration and teardown.
2. **DOM Binding Layer**
   - Accepts `MediaSourceConfig` and `MediaPlayerOptions`, creates the correct native element, and keeps it in sync with state.
   - Provides accessors for the active underlying element while abstracting away browser-specific quirks behind a consistent facade.
   - Coordinates responsive sizing/aspect ratio management for both dynamic (video/audio) and static (image) media.
3. **Plugin System**
   - Plugins receive a scoped `MediaPlayer` instance plus helper context (logger, theme API once implemented).
   - Plugins can register to lifecycle events and optionally expose UI; they are responsible for their own cleanup via returned disposers.
   - Author plugins by calling `player.use(plugin, options)`. The provided `MediaPluginContext` exposes:
     - `player`: the MediaPlayer API (playback commands, state).
     - `getMediaConfig()` / `getPlayerOptions()`: immutable snapshots of the current config.
     - `on/once/off`: typed event helpers so plugins can react to lifecycle and playback changes.
     - `options`: frozen plugin-specific options passed via `use`.
   - Plugins must return a cleanup disposer if they set up DOM or event listeners so the core can call it during `dispose`.
4. **Framework Adapters**
   - Thin wrappers that instantiate a `MediaPlayer` and tie it to framework-specific templating.
   - Provide idiomatic hooks (`useMediaPlayer`, `useMediaState`) but never reimplement playback logic.

## Media Modes

Three media modes provide a single configuration surface:

- **Video Mode** — Leverages `<video>` for time-based media with audio + visuals. Supports multi-source selection, track management, and PiP.
- **Audio Mode** — Uses `<audio>` and focuses on audio-first UX (compact controls, poster/thumb fallbacks).
- **Image Mode** — Wraps `<img>` with unified load/error events, decoding strategies, and consistent sizing/aspect ratio handling so still imagery can reuse theming/plugins (e.g., overlays, captions).

Mode-specific state is kept under a discriminated union so the rest of the API can stay strongly typed while still allowing shared operations (e.g., `mount`, `dispose`, `plugins`).

## Core Interfaces

The TypeScript layer (defined in `src/types.ts`) captures the contracts between components:

- **`MediaPlayer`** — Primary control surface. Defines playback commands (`play`, `pause`, `seekTo`, etc.), state access (`getState`, `getCurrentSource`), lifecycle (`mount`, `dispose`), and event subscription methods (`on`, `off`, `once`). Also exposes metadata (`kind`, `id`) and references to the underlying native element when mounted.
- **`MediaSource` & `MediaSourceConfig`** — Describe source selection. `MediaSource` holds individual source metadata (src, type, label, bitrate). `MediaSourceConfig` binds a `MediaKind`, an ordered list of sources, optional tracks, posters, and image-specific data.
- **`PlaybackState` & `PlaybackSnapshot`** — Enumerate canonical player states (`idle`, `loading`, `ready`, `playing`, `paused`, `seeking`, `ended`, `error`). Snapshots add time-based data (current time, duration, buffered ranges, volume, muted flag, etc.) for observers and debugging.
- **`MediaEventMap`** — Strongly typed event payloads covering native media events plus library-specific hooks (source changes, plugin lifecycle notifications, image load/decode, PiP transitions).
- **`MediaPlugin` & `MediaPluginContext`** — Describe the plugin API contract. Plugins declare a `name`, implement `setup`, and optionally return `dispose`. `MediaPluginContext` contains the player reference, plugin-scoped options, and eventual extension surfaces (theme registry, logger).
  - UI plugins (e.g., the `minimal-controls` plugin in `src/plugins/minimal-controls.ts`) can import shared CSS, inject DOM alongside the media element, and use event helpers to stay in sync with playback. Core keeps plugins framework-agnostic by never exposing DOM-only helpers directly.
- **`MediaPlayerOptions`** — Consolidates configuration: autoplay, preload strategy, lazy mounting, looping, default volume/rate, inline playback, responsiveness, preferred modes, and accessibility hints (captions default, aria labels).

Future tasks (DOM bindings, UI shell, adapters) will rely on these interfaces. Keeping them centralized ensures the package maintains strict typing and a consistent developer experience across frameworks.

## Data & Event Flow

1. **Initialization** — `MediaPlayer` is instantiated with `MediaSourceConfig` and `MediaPlayerOptions`. Plugins can be registered immediately (before mount) to observe lifecycle events.
2. **Mount** — When `mount` is called with a host element/reference, the DOM binding layer creates the correct native element and syncs attributes. Once metadata is loaded, a `ready` event is emitted with the first `PlaybackSnapshot`.
3. **Interaction** — Playback commands update state, which in turn drives attribute updates on the native element. Browser events are normalized and emitted through the typed event bus.
4. **Plugins/UI** — Plugins listen to events and call player APIs. Because they only talk to the `MediaPlayer` interface, they can run equally in vanilla or framework contexts.
5. **Dispose** — `dispose` tears down listeners, detaches elements, resets sources, and calls plugin disposers so memory and media resources are released promptly.

This architecture balances flexibility (headless core, optional UI) with consistency (typed interfaces, shared event bus), enabling the remaining tasks in the PRD to build on a clear, documented foundation.
