import { describe, expectTypeOf, it } from 'vitest';
import { compile } from './runtime/renderer.js';
import { declareContext, typedCompile } from './typing.js';
import type { PartialContexts } from './typing.js';
import type { Template } from './types.js';

interface PageBindings {
  title: string;
  count: number;
}

interface CardPartialContext {
  label: string;
}

describe('declareContext (type-level)', () => {
  it('types Template.mount/hydrate/render parameters', () => {
    const template = declareContext<PageBindings>().compile('<p>{{ title }}</p>');
    expectTypeOf(template.mount).parameters.toEqualTypeOf<[Element, PageBindings]>();
    expectTypeOf(template.hydrate).parameters.toEqualTypeOf<[Element, PageBindings]>();
    expectTypeOf(template.render).parameters.toEqualTypeOf<[PageBindings]>();
    expectTypeOf(template.renderToString).parameters.toEqualTypeOf<[PageBindings]>();
  });

  it('rejects mount with an incompatible context shape', () => {
    const template = declareContext<PageBindings>().compile('<p>{{ title }}</p>');
    expectTypeOf(template.mount).parameter(1).not.toEqualTypeOf<{ wrong: boolean }>();
  });

  it('types partial values when a partial context map is provided', () => {
    const cardTemplate = compile<CardPartialContext>('<span>{{ label }}</span>');
    const page = declareContext<PageBindings>();
    const template = page.compile<{ card: CardPartialContext }>('<div>{{> card}}</div>', {
      partials: { card: cardTemplate },
    });
    expectTypeOf(template).toEqualTypeOf<Template<PageBindings>>();
  });

  it('types fromPrecompiled like compile', () => {
    const factory = declareContext<PageBindings>();
    expectTypeOf(factory.fromPrecompiled).returns.toEqualTypeOf<Template<PageBindings>>();
  });

  it('rejects partials whose Template context does not match the declared map', () => {
    const cardTemplate = compile<CardPartialContext>('<span>{{ label }}</span>');
    const page = declareContext<PageBindings>();
    page.compile<{ card: PageBindings }>('<div>{{> card}}</div>', {
      // @ts-expect-error cardTemplate is Template<CardPartialContext>, not Template<PageBindings>
      partials: { card: cardTemplate },
    });
  });
});

describe('typedCompile (type-level)', () => {
  it('is equivalent to compile<T>()', () => {
    const a = compile<PageBindings>('<p></p>');
    const b = typedCompile<PageBindings>('<p></p>');
    expectTypeOf(a).toEqualTypeOf(b);
  });
});

describe('PartialContexts (type-level)', () => {
  it('maps partial names to context types', () => {
    type Partials = PartialContexts<{ header: PageBindings; card: CardPartialContext }>;
    expectTypeOf<Partials['header']>().toEqualTypeOf<PageBindings>();
    expectTypeOf<Partials['card']>().toEqualTypeOf<CardPartialContext>();
  });
});
