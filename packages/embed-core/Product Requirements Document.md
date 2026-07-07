# Product Requirements Document: Web Loom Embed Core

| Field | Value |
| --- | --- |
| Package | `@web-loom/embed-core` |
| Location | `packages/embed-core` |
| Status | Draft v1.0 |
| Product type | Framework-agnostic embeddable widget SDK and host integration layer |
| Primary users | Web Loom product developers, third-party host integrators, platform operators |
| Related packages | `@web-loom/event-emitter-core`, `@web-loom/design-core`, `@web-loom/plugin-core`, `@web-loom/shared` |

## 1. Executive Summary

`@web-loom/embed-core` provides the standard way for any Web Loom product to be embedded into any website or web application. It turns the repeated work of script snippets, command queues, widget mounting, iframe or Shadow DOM isolation, configuration, consent gating, and host-to-widget communication into one reusable package.

This package is not an analytics product, UI component library, or framework adapter. It is the integration contract that future Web Loom products reuse when they need to appear inside customer pages, partner sites, SPAs, CMS pages, tag managers, or static HTML.

The intended developer experience is:

```html
<script
  async
  src="https://cdn.example.com/embed/v1/embed.js?cid=ck_live_123&pid=proj_456">
</script>

<button onclick="wl('open', 'advisor')">Open Advisor</button>
```

The same runtime must also support npm users:

```ts
import { createEmbed } from '@web-loom/embed-core/host';

const wl = createEmbed({ clientId: 'ck_live_123', projectId: 'proj_456' });
const advisor = await wl.mount('advisor', '#advisor-slot', { placement: 'inline' });

advisor.on('completed', (result) => {
  console.log(result);
});
```

## 2. Problem Statement

Every embeddable product eventually needs the same infrastructure:

- An async script loader that does not block the host page.
- A pre-load command queue so host code can call the API before the runtime arrives.
- Public client or project identifiers that can be safely placed in browser code.
- A small global API for non-bundled sites.
- A typed ESM API for SPAs and bundled apps.
- Declarative activation for CMS, marketing, tag-manager, and low-code contexts.
- Widget lifecycle management.
- Host-to-widget commands and widget-to-host events.
- Isolation through Shadow DOM or iframe.
- Origin checks, CSP guidance, consent behavior, and teardown discipline.

Without a shared package, every Web Loom product will invent a different embed story. That creates inconsistent integration docs, brittle security decisions, duplicated queue and bridge code, and long-term support costs.

`embed-core` solves that by defining one stable, framework-agnostic embed contract.

## 3. Product Vision

Web Loom products should be embeddable in under five minutes by copying a script tag, while still giving professional frontend teams a typed, deterministic API through npm.

The SDK should feel familiar to developers who have used tools such as Intercom, Segment, Hotjar, Stripe Elements, Calendly, Typeform, Zendesk, LaunchDarkly, or similar browser SDKs. The package should intentionally use established browser patterns instead of inventing novel integration mechanisms.

## 4. Goals

1. Provide a one-line script integration path with optional zero-JavaScript usage.
2. Support queued API calls before the SDK runtime is loaded.
3. Provide a small, stable public API with no more than 12 primary operations.
4. Support four integration modes over one runtime: script/global API, npm ESM API, data attributes, and custom element.
5. Support Shadow DOM and iframe widget containers behind one lifecycle and message API.
6. Provide a versioned message protocol for host-to-widget commands and widget-to-host events.
7. Provide clear rules for public identifiers, publishable keys, origin allow-listing, and secret-key rejection.
8. Provide explicit consent behavior: no storage, backend transmission, or widget-code loading before the consent gate allows it when manual consent is configured.
9. Keep runtime bundles small and framework agnostic.
10. Follow Web Loom package conventions: TypeScript, Vite, Vitest, dual ESM/browser outputs where appropriate, and strong types.

## 5. Non-Goals

1. Do not implement analytics, autocapture, session replay, heatmaps, funnels, feature flags, surveys, or recommendations in `embed-core`.
2. Do not define product-specific event names such as `pageview`, `signup_completed`, or `session_started`.
3. Do not provide a backend ingestion API or server SDK.
4. Do not provide React, Vue, Angular, or Svelte wrappers in v1.
5. Do not provide a visual widget library. Widgets bring their own UI.
6. Do not support IE11 or legacy browser baselines outside evergreen Chrome, Edge, Firefox, and Safari.
7. Do not require cookies or local storage in the core package.
8. Do not expose secret keys, private tokens, or privileged authentication values in the browser API.

## 6. Users and Personas

### 6.1 Widget Author

A Web Loom or product developer building an embeddable product such as an advisor, feedback form, survey, help center, recommendation panel, or assistant.

Needs:

- Define a widget once.
- Receive commands from the host page.
- Emit typed events back to the host page.
- Avoid rewriting loader, queue, consent, iframe, and postMessage code.

### 6.2 Host Integrator: Static or CMS Site

A developer, marketer, agency partner, or tag-manager user integrating a widget into a page they may not fully control.

Needs:

- Copy a script tag.
- Configure through URL parameters or `data-*` attributes.
- Open or mount widgets without build tooling.
- Avoid race conditions from async loading.

### 6.3 Host Integrator: SPA Engineer

A frontend engineer embedding a Web Loom product into React, Vue, Angular, Svelte, Solid, Astro, Next.js, Nuxt, or vanilla TypeScript.

Needs:

- Install through npm.
- Import an SSR-safe ESM entry point.
- Use typed handles and lifecycle cleanup.
- Comply with CSP and consent requirements.

### 6.4 Platform Operator

The engineer or team operating CDN assets, product configuration, origin allow-lists, kill switches, and versioned runtime releases.

Needs:

- Versioned artifacts.
- Pinned and floating major URLs.
- SRI support.
- Remote config and emergency disable behavior.

## 7. Design Principles

- Use established browser SDK patterns: async loader, command queue, global facade, typed ESM API, data attributes, custom elements, Shadow DOM, iframe, and `postMessage`.
- Keep core generic. Product-specific behavior belongs in widgets and product packages.
- Keep configuration explicit and inspectable.
- Treat browser-visible identifiers as public by design.
- Make every lifecycle operation idempotent where practical.
- Prefer typed APIs for application developers and HTML attributes for declarative contexts.
- Do not let the widget author care whether the widget is mounted in Shadow DOM or an iframe.
- Fail loudly in development and safely in production.

## 8. Package Architecture

`@web-loom/embed-core` is one package with multiple entry points:

```text
@web-loom/embed-core
|-- /loader      # snippet generator and tiny browser loader
|-- /host        # host runtime and npm API
|-- /widget      # widget author API
|-- /protocol    # versioned message envelope and validators
`-- /testing     # test helpers and fake transports
```

### 8.1 `/loader`

Responsible for the smallest possible script path.

Requirements:

- Create a configurable global namespace, defaulting to `wl`.
- Queue calls made before the host runtime is loaded.
- Read configuration from the current script URL and script `data-*` attributes.
- Inject the host runtime script asynchronously.
- Avoid `document.write`.
- Avoid top-level dependencies beyond the browser DOM.
- Expose `generateSnippet(options)` for products that need branded snippets.

Example generated snippet:

```html
<script>
  (function(w,d,s,n,u){w[n]=w[n]||function(){(w[n].q=w[n].q||[]).push(arguments)};
  w[n].l=+new Date;var e=d.createElement(s);e.async=1;e.src=u;
  d.getElementsByTagName(s)[0].parentNode.insertBefore(e,d.getElementsByTagName(s)[0]);
  })(window,document,'script','wl','https://cdn.example.com/embed/v1/embed.js?cid=CLIENT_ID&pid=PROJECT_ID');
</script>
```

### 8.2 `/host`

Responsible for the real runtime used by both CDN and npm users.

Requirements:

- Drain queued calls in order.
- Replace the loader stub with the real facade.
- Initialize configuration and consent state.
- Resolve the widget registry from static config or remote config.
- Mount widgets imperatively, declaratively, or through the custom element.
- Manage same-document and cross-document transports.
- Expose typed `EmbedRuntime` and `WidgetHandle` APIs.
- Use `@web-loom/event-emitter-core` for event fan-out.

### 8.3 `/widget`

Responsible for the API consumed by widget authors.

Requirements:

- Provide `defineWidget(spec)`.
- Provide a `WidgetContext` with config, props, identity, theme tokens, command subscription, and event emission.
- Allow one widget implementation to run in Shadow DOM or iframe.
- Return a cleanup function from `mount`.
- Support declaration of supported placements, commands, events, and storage keys.

Example:

```ts
import { defineWidget } from '@web-loom/embed-core/widget';

export default defineWidget({
  name: 'advisor',
  version: '1.0.0',
  placements: ['inline', 'modal'],
  commands: ['prefill', 'reset'] as const,
  events: ['completed', 'dismissed', 'error'] as const,
  storageKeys: ['wl-advisor-draft'],

  mount(container, ctx) {
    ctx.onCommand('prefill', (payload) => {
      // update widget state
    });

    return () => {
      // cleanup
    };
  },
});
```

### 8.4 `/protocol`

Responsible for the versioned message envelope shared by host and widget runtimes.

Requirements:

- Define the protocol shape and validation helpers.
- Support handshake, command, event, and error messages.
- Validate protocol major version.
- Validate widget instance IDs.
- Provide structured error codes.

### 8.5 `/testing`

Responsible for test-only utilities.

Requirements:

- Fake host runtime.
- Fake widget runtime.
- Fake transport for unit tests.
- Helpers for queue-drain and consent tests.

## 9. Integration Modes

All integration modes must use the same runtime and lifecycle rules.

### 9.1 Script Tag and Global API

Primary path for static pages, CMS sites, marketing sites, and tag managers.

```html
<script
  async
  src="https://cdn.example.com/embed/v1/embed.js?cid=ck_live_123&pid=proj_456"
  data-env="production"
  data-consent="manual">
</script>

<button onclick="wl('open', 'advisor', { placement: 'modal' })">
  Open Advisor
</button>
```

Rules:

- `cid`, `pid`, and `env` query parameters are aliases for `clientId`, `projectId`, and `environment`.
- Script `data-*` attributes override URL parameters.
- Explicit `wl('init', config)` overrides URL and script attributes.
- `init` is idempotent. Repeated compatible calls no-op; conflicting calls emit a warning or typed error.
- Any command may be queued before runtime load.

### 9.2 NPM ESM API

Primary path for bundled SPAs and typed applications.

```ts
import { createEmbed } from '@web-loom/embed-core/host';

const wl = createEmbed({
  clientId: 'ck_live_123',
  projectId: 'proj_456',
  environment: 'production',
});

await wl.ready();

const handle = await wl.mount('advisor', '#advisor-slot', {
  placement: 'inline',
  props: { topic: 'pricing' },
});

handle.send('prefill', { topic: 'billing' });
handle.on('completed', (payload) => console.log(payload));
```

Rules:

- Entry points must be import-safe in Node and SSR contexts.
- Browser-only APIs may only run when `createEmbed` is called in a browser.
- `destroy()` must remove listeners, DOM nodes, observers, and iframe handlers.

### 9.3 Declarative Data Attributes

Primary path for CMS pages, tag managers, simple HTML integrations, and low-code contexts.

```html
<div
  data-wl-widget="advisor"
  data-wl-placement="inline"
  data-wl-prop-topic="pricing">
</div>

<button
  data-wl-open="advisor"
  data-wl-placement="modal">
  Open Advisor
</button>
```

Rules:

- The runtime scans for declarative widgets after initialization.
- A debounced `MutationObserver` detects new declarative nodes.
- `data-wl-prop-*` attributes map to widget props with kebab-case converted to camelCase.
- Declarative mount must not duplicate an already mounted element.

### 9.4 Custom Element

Declarative component path for teams that prefer Web Components.

```html
<wl-widget
  name="advisor"
  placement="inline"
  topic="pricing">
</wl-widget>
```

```ts
const el = document.querySelector('wl-widget');

el?.addEventListener('wl:completed', (event) => {
  console.log((event as CustomEvent).detail);
});
```

Rules:

- Register `wl-widget` only once.
- Attribute changes should update props where supported.
- Widget events should re-dispatch as composed, bubbling `CustomEvent`s prefixed with `wl:`.
- The element exposes imperative helpers such as `send`, `open`, `close`, and `destroy` when mounted.

## 10. Public API

The v1 API should stay small and additive.

| Operation | Global command form | Method form | Description |
| --- | --- | --- | --- |
| Init | `wl('init', config)` | `createEmbed(config)` | Initialize config and consent state. |
| Ready | `wl('ready', callback)` | `wl.ready()` | Resolve after init and config resolution. |
| Mount | `wl('mount', name, target, options?)` | `wl.mount(name, target, options?)` | Mount a widget into a target. |
| Open | `wl('open', name, options?)` | `wl.open(name, options?)` | Open or lazily mount a widget. |
| Close | `wl('close', nameOrId?)` | `wl.close(nameOrId?)` | Hide a widget without destroying it. |
| Destroy | `wl('destroy', nameOrId?)` | `wl.destroy(nameOrId?)` | Unmount one widget or all widgets. |
| Send | `wl('send', nameOrId, command, payload?)` | `handle.send(command, payload?)` | Send a command to a widget. |
| On | `wl('on', event, callback)` | `wl.on(event, callback)` / `handle.on(event, callback)` | Subscribe to events. |
| Off | `wl('off', event, callback?)` | `wl.off(event, callback?)` / `handle.off(event, callback?)` | Unsubscribe from events. |
| Once | `wl('once', event, callback)` | `wl.once(event, callback)` / `handle.once(event, callback)` | Subscribe once. |
| Identify | `wl('identify', identity)` | `wl.identify(identity)` | Set host-provided identity context. |
| Consent | `wl('consent', state)` | `wl.consent(state)` | Grant or deny runtime consent. |

### 10.1 Core Types

```ts
export interface EmbedConfig {
  clientId: string;
  projectId?: string;
  environment?: 'development' | 'staging' | 'production';
  namespace?: string;
  configEndpoint?: string;
  runtimeUrl?: string;
  consentMode?: 'implicit' | 'manual';
  debug?: boolean;
  theme?: unknown;
  locale?: string;
  identity?: EmbedIdentity;
  metadata?: Record<string, unknown>;
}

export interface EmbedIdentity {
  userId?: string;
  traits?: Record<string, unknown>;
  organizationId?: string;
  tenantId?: string;
  workspaceId?: string;
}

export interface MountOptions {
  placement?: 'inline' | 'modal' | 'launcher';
  props?: Record<string, unknown>;
  target?: string | HTMLElement;
  container?: 'shadow' | 'iframe';
  widgetUrl?: string;
}

export interface WidgetHandle {
  id: string;
  name: string;
  placement: 'inline' | 'modal' | 'launcher';
  send(command: string, payload?: unknown): void;
  on(event: string, callback: (payload: unknown) => void): () => void;
  off(event: string, callback?: (payload: unknown) => void): void;
  once(event: string, callback: (payload: unknown) => void): () => void;
  open(): void;
  close(): void;
  destroy(): void;
}
```

## 11. Configuration and Identifier Rules

### 11.1 Public Identifier Doctrine

Browser-visible identifiers are public by design.

| Identifier | Example | Browser safe | Purpose |
| --- | --- | --- | --- |
| `clientId` | `ck_live_abc123` | Yes | Identifies the account or customer for config resolution. |
| `projectId` | `proj_456` | Yes | Selects a project, workspace, or environment. |
| publishable key | Same role as `clientId` | Yes | Public, origin-bound identifier. |
| secret key | `sk_live_...` | No | Must never be accepted by this SDK. |

Security must come from server-side origin allow-listing and scoped remote configuration, not secrecy of browser identifiers.

Requirements:

- Reject or warn in development when config includes keys that look like secret credentials.
- Never document secret keys as accepted SDK inputs.
- Remote config must validate `clientId`, `projectId`, and `location.origin`.

### 11.2 Configuration Precedence

Later sources override earlier sources:

1. Build-time product defaults.
2. Script URL query parameters.
3. Script tag `data-*` attributes.
4. Remote config from the configured endpoint.
5. Explicit `init(config)`.
6. Per-mount options.

Remote config is optional. Products may compile a static widget registry into the runtime for offline or kiosk contexts.

### 11.3 Remote Config

Remote config may include:

- Widget registry.
- Runtime URLs.
- Widget URLs.
- Allowed placements.
- Theme tokens.
- Feature flags.
- Environment settings.
- Kill switch.
- CSP hints.

Remote config must not include secret credentials.

## 12. Widget Registry

The host runtime needs a registry that maps widget names to loadable widget definitions.

```ts
export interface WidgetRegistryEntry {
  name: string;
  version: string;
  url?: string;
  module?: () => Promise<unknown>;
  origin?: string;
  placements: Array<'inline' | 'modal' | 'launcher'>;
  defaultPlacement?: 'inline' | 'modal' | 'launcher';
  container?: 'shadow' | 'iframe' | 'auto';
  propsSchema?: unknown;
}
```

Requirements:

- Load widget code lazily on first mount or open.
- Allow static ESM registration for npm users.
- Allow URL-based registration for CDN and remote-config users.
- Validate placement support before mount.
- Track widget state: `idle`, `loading`, `mounted`, `open`, `closed`, `destroyed`, `error`.

## 13. Message Protocol

The protocol is internal but versioned because widgets and hosts may ship separately.

```ts
export interface EmbedMessage<T = unknown> {
  wl: 1;
  kind:
    | 'handshake'
    | 'handshake-ack'
    | 'command'
    | 'event'
    | 'error'
    | 'destroy';
  widgetId: string;
  widgetName: string;
  name: string;
  payload?: T;
  ts: number;
  nonce?: string;
}
```

Rules:

- `wl` is the protocol major version.
- Minor evolution is additive only.
- Unknown protocol major versions fail handshake.
- Commands sent before iframe handshake are buffered.
- Handshake timeout defaults to 10 seconds.
- Payloads must be structured-clone-safe for iframe transport.
- All cross-document messages must validate `event.origin`.
- Wildcard iframe origins are invalid in production builds.

## 14. Transports and Isolation

### 14.1 Shadow DOM Transport

Use for inline widgets that run in the same document.

Requirements:

- Mount into a ShadowRoot by default for inline widgets.
- Provide optional same-document event transport without serialization.
- Scope styles to the shadow tree where practical.
- Teardown removes the shadow host and listeners.

### 14.2 Iframe Transport

Use for modal, launcher, floating, cross-origin, or stronger-isolation widgets.

Requirements:

- Create iframe lazily.
- Include host origin and widget instance metadata in a safe mount URL format.
- Validate widget origin from registry or remote config.
- Validate host origin during widget handshake.
- Buffer host commands until handshake completes.
- Tear down `message` listeners on destroy.

### 14.3 Container Selection

Default behavior:

- `inline` uses Shadow DOM unless registry forces iframe.
- `modal` uses iframe unless registry explicitly supports Shadow DOM.
- `launcher` uses iframe by default because it usually needs hard positioning and isolation.

## 15. Consent, Privacy, and Storage

The core SDK must be privacy-ready and conservative.

Requirements:

- The core SDK sets no cookies.
- The core SDK writes no localStorage, sessionStorage, or IndexedDB by default.
- The core SDK sends no analytics or product events to a backend by itself.
- `identify()` only stores in-memory identity context and passes it to widgets through `ctx`.
- `consentMode: 'implicit'` opens the gate on init.
- `consentMode: 'manual'` keeps the gate closed until `consent('granted')`.
- When consent is denied, widgets are not loaded and existing widgets are destroyed.
- Widget authors must declare `storageKeys` if their widget uses browser storage.
- Dev mode should warn when declared storage keys are missing or inconsistent with widget behavior where detection is possible.

Consent states:

```ts
export type ConsentState = 'unknown' | 'granted' | 'denied';
```

## 16. Error Handling

The runtime should not crash the host page for expected integration failures.

Requirements:

- Surface typed errors through `wl.on('error', callback)`.
- Log helpful warnings in development.
- Avoid throwing from global command calls in production.
- Throw typed errors from direct npm calls only when the developer can reasonably catch them.

Core error codes:

| Code | Meaning |
| --- | --- |
| `INIT_REQUIRED` | A command requires initialization first. |
| `CONFIG_INVALID` | Config validation failed. |
| `SECRET_KEY_REJECTED` | A browser config value appears to contain a secret key. |
| `WIDGET_NOT_FOUND` | Registry does not contain the requested widget. |
| `PLACEMENT_UNSUPPORTED` | Widget does not support the requested placement. |
| `HANDSHAKE_TIMEOUT` | Iframe widget did not complete handshake. |
| `ORIGIN_REJECTED` | Message origin did not match registry expectations. |
| `CONSENT_REQUIRED` | Operation is blocked by manual consent mode. |
| `LOAD_FAILED` | Runtime or widget code failed to load. |
| `DESTROYED` | Operation targeted a destroyed runtime or widget. |

## 17. Performance and Delivery

Targets:

| Artifact | Target |
| --- | --- |
| Inline stub | <= 0.5 KB minified |
| Loader script | <= 2 KB min+gzip |
| Host runtime | <= 8 KB min+gzip, excluding widgets |
| Widget runtime helper | <= 6 KB min+gzip |
| Boot work | No long task above 50 ms on mid-tier mobile |

Requirements:

- Use async script loading.
- Defer DOM scans with `requestIdleCallback` or a fallback timer.
- Lazy-load widget code on first mount or open.
- Avoid unnecessary runtime dependencies. Runtime dependency target: `@web-loom/event-emitter-core` only.
- CI should enforce bundle budgets before release.

CDN paths:

- Floating major: `/embed/v1/embed.js`
- Pinned version: `/embed/1.4.2/embed.js`

Pinned versions should support immutable caching and SRI.

## 18. CSP and Security Guidance

The package must ship documentation and helpers for Content Security Policy.

Minimum directives depend on product configuration:

```text
script-src https://cdn.example.com;
connect-src https://api.example.com;
frame-src https://widgets.example.com;
```

Requirements:

- Avoid requiring `unsafe-inline` for the external script-tag integration.
- Avoid `eval` and dynamic code generation.
- Provide CSP examples for script-only, iframe, and remote-config modes.
- Provide a helper that can generate recommended directives from runtime config.

## 19. SSR and Browser Compatibility

Requirements:

- ESM entry points must not access `window` or `document` at module evaluation time.
- `createEmbed()` must detect non-browser environments and throw or return a typed no-op depending on selected mode.
- Custom elements must only register in browsers with `customElements`.
- Browser target: last two versions of Chrome, Edge, Firefox, and Safari.
- No IE11 support.

## 20. Testing Strategy

### 20.1 Unit Tests

Use Vitest and jsdom for:

- Loader queue creation and draining.
- Command ordering.
- Config precedence.
- URL and `data-*` parsing.
- Init idempotency.
- Event subscription and unsubscription.
- Widget registry behavior.
- Consent gate state transitions.
- Error code generation.
- Protocol validation.

### 20.2 Cross-Document Tests

Use Playwright or an equivalent browser harness for:

- Iframe handshake.
- Origin rejection.
- Pre-handshake command buffering.
- Message payload fidelity.
- Iframe teardown and listener cleanup.
- CSP-oriented fixture behavior.

### 20.3 Integration Fixtures

Add example apps or fixtures:

- `apps/embed-host-demo`: vanilla host page exercising script, data attributes, custom element, and npm-style usage.
- `apps/embed-widget-demo`: trivial widget using `defineWidget`.

### 20.4 Compatibility Tests

Cover:

- Script executes while `document.readyState` is `loading`, `interactive`, and `complete`.
- Double script injection.
- Two namespaces coexisting on one page.
- Missing target nodes.
- Destroy during load.
- Consent denied before and after widget load.

## 21. Documentation Requirements

The package must ship:

- Package README.
- Script-tag quick start.
- NPM quick start.
- Data attribute reference.
- Custom element reference.
- Widget author guide.
- Protocol overview.
- Configuration and public-key doctrine.
- Consent and privacy guide.
- CSP guide.
- Troubleshooting guide.

## 22. Implementation Plan

### Phase 1: Package Scaffold and Protocol

Scope:

- Create package structure.
- Configure Vite, TypeScript, Vitest, and declaration output.
- Implement core types.
- Implement protocol envelope validators.
- Implement error codes.
- Implement in-memory event fan-out using `@web-loom/event-emitter-core`.

Exit criteria:

- Package builds.
- Types generate.
- Protocol unit tests pass.
- Error taxonomy is documented.

### Phase 2: Host Runtime Core

Scope:

- Implement `createEmbed`.
- Implement `init`, `ready`, `on`, `off`, `once`, `identify`, `consent`, and `destroy`.
- Implement config parsing and precedence.
- Implement registry state.
- Implement queue drain semantics.

Exit criteria:

- Global queued calls replay in order.
- `createEmbed` works through ESM.
- Config precedence matrix is fully tested.
- Runtime is SSR import-safe.

### Phase 3: Mounting and Transports

Scope:

- Implement `mount`, `open`, `close`, `send`, and `WidgetHandle`.
- Implement Shadow DOM inline mounting.
- Implement iframe mounting and handshake.
- Implement transport abstraction.
- Implement widget author API with `defineWidget`.

Exit criteria:

- Demo widget mounts in Shadow DOM and iframe.
- Host-to-widget commands and widget-to-host events work.
- Handshake timeout and origin rejection are tested.
- Destroy cleans up DOM and listeners.

### Phase 4: Loader and Declarative APIs

Scope:

- Implement loader stub and snippet generator.
- Implement script self-config parsing.
- Implement data attribute scanner.
- Implement debounced MutationObserver.
- Implement `wl-widget` custom element.

Exit criteria:

- Script-only integration works.
- Data-attribute widgets auto-mount.
- Custom element mounts, updates attributes, emits `wl:*` events, and destroys cleanly.
- Double script injection does not corrupt state.

### Phase 5: Hardening, Documentation, and Release

Scope:

- Add consent gate enforcement.
- Add remote config support and kill switch.
- Add CSP helper and docs.
- Add size-limit checks.
- Add integration fixtures.
- Write README and guides.

Exit criteria:

- Bundle targets are enforced.
- Manual consent mode is demonstrated.
- Remote config can disable runtime safely.
- All documented integration modes have tests or fixtures.
- Package is ready for pre-1.0 release as `@web-loom/embed-core@0.1.0`.

## 23. Success Metrics

| Metric | Target |
| --- | --- |
| Time to first script integration | Under 5 minutes |
| Public API size | 12 primary operations or fewer |
| Host runtime size | <= 8 KB min+gzip, excluding widgets |
| Widget code loading | Lazy, never on boot unless explicitly preloaded |
| Protocol and host test coverage | >= 90% for core modules |
| Consent default | No storage or backend transmission from core |
| SSR safety | All entry points importable in Node |

## 24. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Scope drifts into analytics or product events | Core becomes bloated and product-specific | Keep analytics, tracking, feature flags, surveys, and recommendations out of core. |
| Host CSP blocks runtime or iframe | Widget fails to appear | Provide CSP docs, helper output, and typed `LOAD_FAILED` diagnostics. |
| Namespace collision | Existing host global breaks integration | Namespace configurable; detect and warn before replacing incompatible globals. |
| Origin validation mistakes | Security boundary weakens | Require explicit widget origin for iframe transport; test accepted and rejected origins. |
| Shadow DOM styling issues | Widget appears broken in complex hosts | Use iframe as escape hatch; document placement tradeoffs. |
| Protocol mismatch between host and widget | Widget fails at runtime | Major-version handshake check and clear `HANDSHAKE_TIMEOUT` or version errors. |
| Consent semantics unclear | Privacy and compliance risk | Make core no-storage/no-transmission; document manual mode and widget `storageKeys`. |

## 25. Open Questions

1. Should the public custom element be `<wl-widget>` or `<web-loom-widget>`? Recommendation: `<wl-widget>` for brevity, with product-specific custom elements allowed later.
2. Should `launcher` placement ship in v1 or v1.1? Recommendation: include the type and minimal iframe fixed-position behavior if it does not expand the API.
3. Should remote config be included in the first release or implemented behind an interface with static config first? Recommendation: design the interface in Phase 2, implement remote fetching in Phase 5.
4. Should `identify()` ever generate anonymous IDs? Recommendation: no in v1 because it requires storage and complicates consent.
5. Should React and Vue adapters exist later? Recommendation: yes, as separate `embed-react` and `embed-vue` packages after the handle API is stable.

## 26. Source Synthesis Notes

This PRD consolidates the three draft PRDs into one package plan:

- From the strongest embed-focused draft: command queue, loader/host/widget entry points, consent, protocol, iframe and Shadow DOM transport, bundle budgets, and milestones.
- From the analytics-integration draft: simple script integration, custom element path, event communication, configuration options, security topics, examples, and success metrics.
- From the broad SDK draft: framework-agnostic positioning, progressive/declarative integration, small API surface, widget lifecycle, lazy loading, and future extension framing.

The synthesized decision is to make the package `@web-loom/embed-core`, not an analytics package. Analytics, surveys, assistants, feature flags, recommendations, and other products can all be built on top of the same embedding contract.
