# @web-loom/embed-core

Framework-agnostic embeddable widget SDK and host integration layer for Web Loom products.

`embed-core` standardizes the browser integration contract: async snippets, queued global commands, typed npm APIs, declarative mounting, custom elements, widget lifecycle, consent gating, and iframe or Shadow DOM transport.

It is not an analytics library, UI kit, backend SDK, or framework adapter.

## Install

```bash
npm install @web-loom/embed-core
```

## NPM Usage

```ts
import { createEmbed } from '@web-loom/embed-core/host';
import { defineWidget } from '@web-loom/embed-core/widget';

const advisor = defineWidget({
  name: 'advisor',
  version: '1.0.0',
  placements: ['inline', 'modal'],
  mount(container, ctx) {
    const button = document.createElement('button');
    button.textContent = 'Complete';
    button.addEventListener('click', () => ctx.emit('completed', { ok: true }));
    container.append(button);
  },
});

const wl = createEmbed({
  clientId: 'ck_live_123',
  projectId: 'proj_456',
  widgets: [
    {
      name: 'advisor',
      placements: ['inline', 'modal'],
      module: () => advisor,
    },
  ],
});

const handle = await wl.mount('advisor', '#advisor-slot', { placement: 'inline' });
handle.on('completed', console.log);
```

## Script and Global API

Products can generate a snippet:

```ts
import { generateSnippet } from '@web-loom/embed-core/loader';

generateSnippet({
  runtimeUrl: 'https://cdn.example.com/embed/v1/embed.js',
  clientId: 'ck_live_123',
  projectId: 'proj_456',
});
```

The global facade supports queued command calls:

```html
<script async src="https://cdn.example.com/embed/v1/embed.js?cid=ck_live_123&pid=proj_456"></script>
<button onclick="wl('open', 'advisor')">Open Advisor</button>
```

Supported commands are `init`, `ready`, `mount`, `open`, `close`, `destroy`, `send`, `on`, `off`, `once`, `identify`, and `consent`.

## Declarative Usage

Data attributes:

```html
<div data-wl-widget="advisor" data-wl-placement="inline" data-wl-prop-topic="pricing"></div>

<button data-wl-open="advisor" data-wl-placement="modal">Open Advisor</button>
```

Custom element:

```html
<wl-widget name="advisor" placement="inline" topic="pricing"></wl-widget>
```

Call `runtime.scan()` to mount data-attribute widgets and `runtime.defineCustomElement()` to register `<wl-widget>`.

## Widget Author API

```ts
import { defineWidget } from '@web-loom/embed-core/widget';

export default defineWidget({
  name: 'advisor',
  version: '1.0.0',
  placements: ['inline', 'modal'],
  commands: ['prefill'],
  events: ['completed'],
  storageKeys: [],
  mount(container, ctx) {
    const unsubscribe = ctx.onCommand('prefill', (payload) => {
      console.log(payload);
    });

    return () => unsubscribe();
  },
});
```

Widgets receive in-memory `config`, `props`, `identity`, and `theme` through `ctx`. Core does not persist identity or transmit analytics.

### Iframe Widgets

Iframe-rendered widgets can use the same widget spec with an iframe-side runtime:

```ts
import { createIframeWidgetRuntime } from '@web-loom/embed-core/widget';
import widget from './advisor-widget';

const runtime = createIframeWidgetRuntime(widget);
await runtime.ready;
runtime.emit('loaded');
```

The helper sends the initial handshake, receives `handshake-ack`, validates the host origin, routes host commands to `ctx.onCommand`, and sends widget events back to the host.

## Consent and Privacy

- Core sets no cookies and writes no browser storage by default.
- `consentMode: 'implicit'` is the default and allows widget loading immediately.
- `consentMode: 'manual'` blocks widget loading until `runtime.consent('granted')`.
- `runtime.consent('denied')` destroys mounted widgets but leaves the runtime usable if consent is granted later.
- Values that look like secret keys (`sk_*`) are rejected.

## CSP

Use `createCspDirectives()` to derive the origins a host page must allow:

```ts
import { createCspDirectives } from '@web-loom/embed-core/host';

createCspDirectives({
  runtimeUrl: 'https://cdn.example.com/embed.js',
  configEndpoint: 'https://api.example.com/config',
  widgets: [{ name: 'advisor', placements: ['modal'], url: 'https://widgets.example.com/advisor.html' }],
});
```

Typical directives:

```text
script-src https://cdn.example.com;
connect-src https://api.example.com;
frame-src https://widgets.example.com;
```

## Troubleshooting

- `WIDGET_NOT_FOUND`: register the widget in `widgets` or remote config.
- `PLACEMENT_UNSUPPORTED`: include the requested placement in the registry entry.
- `CONSENT_REQUIRED`: call `consent('granted')` before mounting in manual mode.
- `ORIGIN_REJECTED`: ensure iframe widget `origin` exactly matches the posted message origin.
- `HANDSHAKE_TIMEOUT`: iframe widgets must send a protocol `handshake` message after loading.

## Size Budgets

After `npm run build --workspace=@web-loom/embed-core`, run:

```bash
npm run test:size --workspace=@web-loom/embed-core
```

The package checks gzip budgets for `loader`, `host`, and `widget` bundles.
