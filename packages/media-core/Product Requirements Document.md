Here's a comprehensive prompt for generating a PRD for a media player library:

---

**Product Requirements Document: @web-loom/media-core - Universal Media Player Library**

**Objective:** Create a minimal, themable, framework-agnostic TypeScript media player library that serves as the foundation for all media playback needs within a media company's web ecosystem.

**Core Requirements:**

1. **Wrapper Architecture:**
   - Create a unified abstraction layer over native HTML5 `<video>`, `<audio>`, `<img>`, and `<source>` elements
   - Maintain direct access to native media APIs while providing enhanced functionality
   - Support all standard media attributes and events from the MDN specification

2. **Technical Stack:**
   - **Language:** TypeScript with strict typing
   - **Build Tool:** Vite for development and production builds
   - **Testing:** Vitest for unit and component testing
   - **Code Splitting:** Automatic code splitting for optimal bundle sizes
   - **Package Scope:** `@web-loom/media-core` as part of the we-bloom framework

3. **Framework Agnostic Design:**
   - Zero framework dependencies in core library
   - Provide adapters/plugins for React, Vue, Svelte, Angular, and vanilla JS
   - Clean separation between core logic and framework-specific bindings

4. **Core Features:**
   - **Playback Control:** Play, pause, seek, volume, playback rate
   - **Media Source Handling:** Support for multiple `<source>` elements with fallback
   - **Image Integration:** Unified API for both dynamic (video/audio) and static (img) media
   - **Cross-browser Consistency:** Normalized behavior across browsers
   - **Accessibility:** Full ARIA support, keyboard navigation, screen reader compatibility
   - **Responsive Design:** Fluid scaling, aspect ratio preservation

5. **Minimal but Themable:**
   - Default minimalist UI that follows platform conventions
   - CSS Custom Properties (CSS variables) for all styling aspects
   - CSS-in-JS theming support with TypeScript definitions
   - Plugin system for UI components (progress bars, controls, captions)
   - Dark/light mode support out of the box

6. **API Design:**
   - **Programmatic API:** Full control via JavaScript/TypeScript
   - **Event System:** Observable events for all media interactions
   - **Plugin Architecture:** Extensible via plugins (inspired by Video.js ecosystem)
   - **Promise-based:** Async operations return Promises
   - **Lifecycle Hooks:** Mount, ready, play, pause, end, dispose

7. **Media Format Support:**
   - HTML5 video/audio formats (MP4, WebM, OGG, MP3, WAV, etc.)
   - HLS and DASH via MediaSource Extensions (plugin-based)
   - Adaptive bitrate streaming support
   - Captions/subtitles (WebVTT, SRT)
   - Thumbnail previews and chapters

8. **Performance & Optimization:**
   - Lazy loading support
   - Preload strategies configurable
   - Memory-efficient resource management
   - Intersection Observer for viewport-based playback
   - Picture-in-Picture support

9. **Developer Experience:**
   - Comprehensive TypeScript definitions
   - Detailed documentation with MDN-like references
   - Interactive examples and playground
   - Framework-specific usage guides
   - Migration path from Video.js and other players

10. **Testing Strategy:**
    - Unit tests for core utilities
    - Component tests for UI elements
    - Integration tests for framework adapters
    - Cross-browser testing matrix
    - Accessibility compliance testing

**Inspiration & Compatibility:**

- Study and learn from Video.js architecture and plugin system
- Maintain compatibility with common Video.js patterns where appropriate
- Implement improved TypeScript support and modern APIs

**Deliverables:**

1. Core media player library (`@web-loom/media-core`)
2. Framework adapters (React, Vue, Svelte, Angular)
3. Documentation site with examples
4. Theme builder tool
5. Common plugins bundle (captions, analytics, quality selector)

**Non-Goals:**

- Built-in advertising system (plugin territory)
- Specific streaming protocol implementations (plugin territory)
- Heavy UI components (keep core minimal)

**Success Metrics:**

- Bundle size under 50KB gzipped for core library
- Support all modern browsers (last 2 versions)
- 95%+ test coverage
- Sub-100ms initialization time
- Framework adapter packages under 10KB each

---

This PRD should guide the development of a robust, extensible media foundation that can scale from simple audio players to complex video streaming interfaces while maintaining developer flexibility and user experience consistency.
