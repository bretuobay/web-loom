Here’s a structured **tasks document** that a team (or coding agent) can follow to execute the **@web-loom/media-core** PRD step by step.

---

# Tasks Document – Execution Plan

## Project: `@web-loom/media-core` – Universal Media Player Library

---

## 0. Foundations & Project Setup

### 0.1 Project Scaffolding

- [x] Create monorepo/package structure (if part of a larger `web-loom` workspace).
- [x] Initialize `@web-loom/media-core` package:
  - [x] `package.json` with proper name, version, exports, types, sideEffects, etc.
  - [x] Set `"type": "module"` or CJS decision.

- [x] Set up **Vite** for:
  - [x] Library build (ESM + CJS + UMD if needed).
  - [x] Dev sandbox / demo environment.

- [x] Configure **TypeScript**:
  - [x] Strict mode enabled (`strict: true`).
  - [x] Path aliases as needed (`@media-core/*`).

- [x] Configure **Vitest**:
  - [x] Unit test setup.
  - [x] DOM testing environment (jsdom).

- [x] Add linting & formatting:
  - [x] ESLint
  - [x] Prettier
  - [x] Git hooks (optional).

### 0.2 Repo Conventions & CI

- [x] Define coding standards (TS strictness, documentation comments, etc.).
- [x] Setup CI pipeline:
  - [x] Install deps.
  - [x] Run tests.
  - [x] Run build.
  - [x] (Optional) Run coverage and thresholds.

---

## 1. Architecture & Core Design

### 1.1 Core Architecture Document

- [ ] Write an **architecture spec**:
  - [ ] Define separation between:
    - Core media engine (logic).
    - DOM bindings (HTML media elements).
    - UI plugin hooks.
    - Framework adapters.

  - [ ] Declare high-level interfaces:
    - `MediaPlayer`
    - `MediaSourceConfig`
    - `MediaEventMap`
    - `MediaPlugin`

- [ ] Decide media “mode” abstraction:
  - [ ] `video`, `audio`, `image` modes.
  - [ ] Shared configuration surface.

### 1.2 Core Types & Interfaces

- [ ] Define **core TS types**:
  - [ ] `MediaKind = 'video' | 'audio' | 'image'`
  - [ ] `MediaSource` (src, type, label, etc.)
  - [ ] `PlaybackState` (playing, paused, ended, buffering).
  - [ ] `MediaPlayerOptions` (autoplay, preload, loop, muted, etc.).
  - [ ] `MediaEvents` (play, pause, timeupdate, ended, error, etc.).

- [ ] Ensure MDN-based coverage:
  - [ ] Map HTMLMediaElement attributes → TS types.
  - [ ] Include `<img>` specifics (loading, decoding, error).

---

## 2. Wrapper Over Native Media Elements

### 2.1 DOM Binding Layer

- [ ] Implement **core wrapper** class (e.g. `MediaCorePlayer`) that:
  - [ ] Accepts a container or element reference.
  - [ ] Creates/attaches `<video>` / `<audio>` / `<img>`.
  - [ ] Applies initial attributes and sources.

- [ ] Expose an API to:
  - [ ] Mount / unmount.
  - [ ] Attach to an existing media element (for maximum flexibility).
  - [ ] Swap media type (if needed).

### 2.2 Media Attributes & Events

- [ ] Map all standard HTML5 media attributes:
  - [ ] `src`, `currentTime`, `duration`, `volume`, `muted`, `loop`, `playbackRate`, `poster`, `preload`, `controls`, etc.

- [ ] Forward all relevant **events**:
  - [ ] `play`, `pause`, `ended`, `timeupdate`, `seeking`, `seeked`, `loadedmetadata`, `canplay`, `error`, `volumechange`, etc.

- [ ] Ensure **event normalization**:
  - [ ] Typed event emitter abstraction (Rx-like or custom).
  - [ ] Consistent event payload shape.

---

## 3. Core Playback & API Design

### 3.1 Playback Control API

- [ ] Implement command methods:
  - [ ] `play(): Promise<void>`
  - [ ] `pause(): void`
  - [ ] `seekTo(seconds: number): void`
  - [ ] `setVolume(value: number): void`
  - [ ] `setPlaybackRate(rate: number): void`
  - [ ] `togglePlayPause(): void`

- [ ] Provide state getters:
  - [ ] `getCurrentTime()`
  - [ ] `getDuration()`
  - [ ] `getVolume()`
  - [ ] `isMuted()`
  - [ ] `getPlaybackRate()`
  - [ ] `getBufferedRanges()`
  - [ ] `getState()` (playing, paused, idle, etc.)

### 3.2 Media Source Handling

- [ ] Implement **multi-source** support:
  - [ ] Accept array of sources (with `type`).
  - [ ] Attempt to pick best playable source based on `canPlayType`.

- [ ] Implement fallback logic:
  - [ ] If no supported source → emit `error` event with reason.

- [ ] Provide API:
  - [ ] `setSources(sources: MediaSource[])`
  - [ ] `getCurrentSource()`

### 3.3 Unified Image Handling

- [ ] Integrate `<img>` mode:
  - [ ] API alignment where possible (`load`, `error`, `decode()` if available).
  - [ ] Use consistent event system for `load` / `error`.
  - [ ] Ensure aspect ratio handling for images.

---

## 4. Event System & Lifecycle Hooks

### 4.1 Event Emitter Implementation

- [ ] Implement internal event emitter:
  - [ ] `on(event, handler)`
  - [ ] `off(event, handler)`
  - [ ] `once(event, handler)`
  - [ ] `emit(event, payload)`

- [ ] Type-safe event mapping using generics.

### 4.2 Lifecycle Hooks

- [ ] Provide lifecycle hooks on the main class:
  - [ ] `onMount`
  - [ ] `onReady`
  - [ ] `onPlay`
  - [ ] `onPause`
  - [ ] `onEnd`
  - [ ] `onDispose`

- [ ] Implement underlying logic for:
  - [ ] `mount(container)`
  - [ ] `dispose()` (cleanup listeners, DOM, sources).

---

## 5. Plugin Architecture

### 5.1 Plugin Interface & Registration

- [ ] Define `MediaPlugin` interface:
  - [ ] `name: string`
  - [ ] `setup(player: MediaPlayer): void`
  - [ ] optional `dispose()`

- [ ] Implement plugin registration:
  - [ ] `use(plugin: MediaPlugin)`
  - [ ] Run plugin `setup` during player initialization.

### 5.2 Common Plugin Hooks

- [ ] Expose hooks/internals for plugins:
  - [ ] Access to event system.
  - [ ] Access to playback API.
  - [ ] Access to player options & metadata.

---

## 6. Theming & Minimal UI

### 6.1 Base UI Shell (Minimal)

- [ ] Build a **minimal control layer** (optional in core or as plugin):
  - [ ] Play/Pause button.
  - [ ] Progress bar.
  - [ ] Volume control.
  - [ ] Time display.

- [ ] Make UI optional/pluggable:
  - [ ] Core should work **headless** (just logic).

### 6.2 Themability

- [ ] Define **CSS Custom Properties**:
  - [ ] Colors, border radius, spacing, typography, heights, etc.

- [ ] Provide a base stylesheet:
  - [ ] Minimal, neutral design.
  - [ ] Dark/light theme variables.

- [ ] Add TypeScript theming definitions (for CSS-in-JS consumers):
  - [ ] `ThemeConfig` interface.
  - [ ] Provide default theme object.

### 6.3 Plugin System for UI Components

- [ ] Create plugin examples:
  - [ ] Progress bar plugin.
  - [ ] Captions toggle plugin.
  - [ ] Settings/gear menu plugin.

---

## 7. Accessibility & Responsiveness

### 7.1 ARIA & A11y

- [ ] Ensure accessible semantics:
  - [ ] Proper roles for controls (e.g., `button`, `slider`).
  - [ ] `aria-label`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for sliders.

- [ ] Keyboard navigation:
  - [ ] Space/Enter to toggle play/pause.
  - [ ] Arrow keys for seeking & volume.
  - [ ] Tab focus order and visible focus state.

- [ ] Screen reader compatibility:
  - [ ] Announce playback state changes (`playing`, `paused`).
  - [ ] Provide visually hidden labels where needed.

### 7.2 Responsive Design

- [ ] Implement fluid layout:
  - [ ] Width = 100%, height based on aspect ratio.

- [ ] Aspect ratio handling:
  - [ ] For video/image: maintain aspect ratio via CSS.
  - [ ] Provide `aspectRatio` option (e.g. `16/9`, `4/3`, `auto`).

---

## 8. Media Format & Advanced Features

### 8.1 Baseline HTML5 Support

- [ ] Verify support & tests for:
  - [ ] MP4, WebM, OGG (video).
  - [ ] MP3, OGG, WAV (audio).

- [ ] Validate APIs with different codecs & platforms.

### 8.2 HLS & DASH (Plugin-Based)

- [ ] Design plugin interfaces for:
  - [ ] HLS plugin (using hls.js or similar).
  - [ ] DASH plugin (dash.js).

- [ ] Implement base plugin stubs (without bundling libs by default):
  - [ ] Example integration.
  - [ ] External peerDependency or optional.

### 8.3 Captions & Subtitles

- [ ] Add caption support:
  - [ ] WebVTT and SRT (converted via plugin).
  - [ ] Track elements `<track kind="subtitles">`.

- [ ] Provide a captions control API:
  - [ ] `setCaptionTrack(id)`
  - [ ] `getAvailableCaptionTracks()`.

### 8.4 Thumbnails & Chapters

- [ ] Define thumbnail API:
  - [ ] Sprite sheets or per-time images.
  - [ ] `getThumbnailForTime(timeInSeconds)` for UI overlays.

- [ ] Chapter support:
  - [ ] chapter metadata.
  - [ ] plugin for chapter UI.

---

## 9. Performance & Optimization

### 9.1 Lazy Loading

- [ ] Implement lazy initialization:
  - [ ] Option to defer media element creation until visible or interacted.

- [ ] Configurable preload strategies:
  - [ ] `preload`: `none | metadata | auto`.

### 9.2 Intersection Observer

- [ ] Implement `autoPause` / `autoPlay` when in/out of viewport (optional):
  - [ ] IntersectionObserver-based plugin or core feature.
  - [ ] Configuration options: threshold, rootMargin.

### 9.3 Resource Management

- [ ] Ensure proper cleanup:
  - [ ] Reset src, load(), remove references on `dispose()`.
  - [ ] Detach event listeners.

- [ ] PiP support:
  - [ ] integrate `requestPictureInPicture()` where supported.
  - [ ] `exitPictureInPicture()`, plus event handling.

---

## 10. Framework Adapters

_(Each adapter is a separate lightweight package that depends on `@web-loom/media-core`.)_

### 10.1 React Adapter (`@web-loom/media-react`)

- [ ] Implement `<MediaPlayer />` React component:
  - [ ] Props map to `MediaPlayerOptions`.
  - [ ] Expose ref to underlying player instance.

- [ ] Provide hooks:
  - [ ] `useMediaPlayer(options)`
  - [ ] `useMediaState()`

### 10.2 Vue Adapter (`@web-loom/media-vue`)

- [ ] Implement `<MediaPlayer />` Vue component.
- [ ] Composition API wrappers:
  - [ ] `useMediaPlayer()`
  - [ ] `useMediaState()`

### 10.3 Svelte Adapter (`@web-loom/media-svelte`)

- [ ] Svelte component `<MediaPlayer />`.
- [ ] Stores for state (`mediaState` store).

### 10.4 Angular Adapter (`@web-loom/media-angular`)

- [ ] Angular component + service:
  - [ ] `<web-loom-media-player>`.
  - [ ] DI for configuration.

### 10.5 Vanilla JS Usage Examples

- [ ] Document plain JS initialization:
  - [ ] `const player = new MediaCorePlayer(container, options);`

---

## 11. Developer Experience & Documentation

### 11.1 TypeScript Definitions

- [ ] Ensure all public APIs are fully typed and exported.
- [ ] Provide JSDoc comments for all public methods & interfaces.

### 11.2 Documentation Site

- [ ] Create docs app (could be VitePress, Docusaurus, etc.):
  - [ ] Getting Started.
  - [ ] Core Concepts.
  - [ ] API Reference.
  - [ ] Plugins Guide.
  - [ ] Theming & CSS variables.
  - [ ] Framework adapter usage guides.

- [ ] Add interactive examples:
  - [ ] Basic audio player.
  - [ ] Video with captions.
  - [ ] HLS plugin example.
  - [ ] Responsive / PiP demo.

### 11.3 Migration Guides

- [ ] Write migration doc:
  - [ ] From plain `<video>` usage → `media-core`.
  - [ ] From Video.js to `media-core`:
    - [ ] Concept mapping (plugins, API, events).

---

## 12. Testing Strategy Implementation

### 12.1 Unit Tests

- [ ] Core utilities (player state, events, time formatting, etc.).
- [ ] Media wrapper methods (play, pause, seek).
- [ ] Plugin APIs.

### 12.2 Component/UI Tests

- [ ] Minimal control UI components.
- [ ] Theming behavior (CSS variable overrides).

### 12.3 Integration Tests

- [ ] Framework adapters with test harnesses (React, Vue, etc.).
- [ ] Multi-source selection behavior.
- [ ] Caption selection & playback interactions.

### 12.4 Cross-Browser Matrix

- [ ] Define supported browsers (last 2 versions).
- [ ] Run manual/automated checks (e.g., via BrowserStack):
  - [ ] Chrome, Firefox, Safari, Edge.
  - [ ] Mobile browsers (Chrome Android, Safari iOS).

### 12.5 Accessibility Testing

- [ ] Use tooling (axe, pa11y) to validate:
  - [ ] ARIA roles and labels.
  - [ ] Keyboard navigation.

- [ ] Manual screen reader checks (VoiceOver, NVDA, etc.).

---

## 13. Release & Success Criteria

### 13.1 Performance & Bundle Targets

- [ ] Optimize build:
  - [ ] Tree-shake unused features.
  - [ ] Separate plugin bundles from core.

- [ ] Validate:
  - [ ] Core library < 50KB gzipped.
  - [ ] Framework adapters < 10KB gzipped.

### 13.2 Public API Freeze

- [ ] Audit exports:
  - [ ] Ensure stable, documented surface.
  - [ ] Mark experimental APIs clearly if any.

### 13.3 Versioning & Publishing

- [ ] Setup publishing pipeline:
  - [ ] `npm publish` (or CI step).
  - [ ] Tag release (e.g., `v1.0.0`).

- [ ] Provide changelog and release notes.

### 13.4 Success Metrics Verification

- [ ] Measure:
  - [ ] Initialization time (<100ms).
  - [ ] Test coverage (>= 95%).
  - [ ] DX feedback from internal users.

---
