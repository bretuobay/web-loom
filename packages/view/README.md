# `@web-loom/view`

Component model for Web Loom's native view layer. Templates stay in `@web-loom/template-core`; this package adds isolated props, optional `setup`/`dispose`, and a `defineComponent` authoring API.

`.loom` files stay markup-only. The component is a sibling TypeScript module.

```ts
import { defineComponent } from '@web-loom/view';
import template from './footer.loom';

export const footerTemplate = defineComponent({
  name: 'footer',
  setup() {
    return { year: new Date().getFullYear() };
  },
  template,
});
```

`setup` runs when the component mounts as `{{> footer}}` or as a root page (`template.mount`). It may return extra template keys plus an optional `dispose` — a natural place to start a screen's fetch. Call-site props stay explicit when the parent owns the data:

```ts
export const greenhouseCard = defineComponent<{ count: number; href: string }>({
  name: 'greenhouse-card',
  props: ['count', 'href'],
  template,
});
```

```html
{{> greenhouse-card count=greenHouses.data$.length href="/greenhouses"}}
```

The call site lists every value the card can read. The card does not inherit the application context bag.

Pages import children the same way: wrap the compiled `.loom` with `withPartials` instead of a global `registerPartial` bag.

```ts
import { withPartials } from '@web-loom/view';
import template from './dashboard.loom';
import { greenhouseCard } from './greenhouse-card';

export const dashboardTemplate = withPartials(template, {
  'greenhouse-card': greenhouseCard,
});
```

Block children use the engine's slot syntax:

```html
{{#> card title=name}} Default slot {{#slot footer}}<button on:click="onEdit">Edit</button>{{/slot}} {{/card}}
```

```html
<article>
  <h3>{{ title }}</h3>
  {{> yield}} {{> yield name="footer"}}
</article>
```

Other frameworks keep using `@web-loom/mvvm-core` and `@web-loom/signals-core` directly. They do not need this package.
