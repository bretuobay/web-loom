---
series: introducing-web-loom
part: 1
summary: How an old C# pattern, a detour through RxJS and a lot of AI-assisted coding became a framework-agnostic MVVM toolkit for the web.
---

# Web Loom: A Playground That Grew Into a Framework

_Part 1 of 4 in the series "Introducing Web Loom"._

---

In June 2025 I created a repository with a modest first commit: _"Initial commit for web-loom utilities repository."_ There was no grand plan. I wanted one place to try ideas out without starting a new project every time something caught my interest. The first experiments were small and unrelated: a typed event bus, a tiny reactive store and a set of design tokens.

Around 750 commits later, the playground has become something bigger. It has 37 workspace packages (counting internal and tooling ones), 16 apps, a documentation site, an 11-part blog series and a 23-chapter book. It also has a name, **Web Loom**, and a point of view.

This series tells the story of how it got there, what it is and why I think its ideas are worth a look, even if you never use a line of it.

## The idea I couldn't shake

At some point I went back to some older C# books on WPF and Prism. If you never worked in that world, WPF is Microsoft's desktop UI framework, and Prism is a library for structuring large WPF applications. Both are built around **MVVM**, which stands for Model–View–ViewModel.

What struck me on a second reading was how _settled_ the architecture felt. Every concern had a home:

- A **Model** holds data and talks to services.
- A **ViewModel** turns that data into exactly what the screen needs, and exposes user actions as **commands**.
- A **View** binds to the ViewModel and does nothing else.
- Features talk to each other through an **event aggregator** instead of reaching into each other's internals.
- Large applications are split into **modules** that can be loaded on their own.

None of this was tied to a particular widget toolkit. A ViewModel didn't care whether WPF, a test runner or nothing at all was rendering it.

Then I looked at a typical web codebase. Business rules lived inside `useEffect`. Loading flags were handled by whoever touched the file last. Validation was copied between three features. When the team changed frameworks, the app was rewritten, because nothing in it was free of the framework and could be carried across.

So the question that took over the playground was simple:

> What would Prism-style MVVM look like on the web if the ViewModel didn't depend on any UI framework at all?

## The shape of the answer

Web Loom's answer is three layers with strict boundaries.

**Models own data.** They fetch, validate and hold state, and they expose it as reactive values. They import no UI framework.

**ViewModels own presentation logic.** They work out what the screen needs: counts, formatted values, filtered lists, whether a button should be enabled. User actions are exposed as `Command` objects that track their own "is running" and "can run" state. ViewModels import no UI framework either.

**Views are thin.** They subscribe to the ViewModel, render what they get and call commands when the user does something. This is the only layer that knows about React, Vue, Angular or anything else.

Here is the smallest useful example. It comes from the starter project that `npm create web-loom@latest` generates:

```ts
import { Command } from '@web-loom/mvvm-core';
import { computed, signal } from '@web-loom/signals-core';

export class CounterViewModel {
  private readonly countState = signal(0);
  readonly count = this.countState.asReadonly();
  readonly doubled = computed(() => this.count.get() * 2);

  readonly incrementCommand = new Command(async () => {
    this.countState.update((n) => n + 1);
  });

  dispose() {
    this.incrementCommand.dispose();
  }
}
```

There is no React or Vue in that file, and nothing about the DOM. You can create it in a unit test, call `incrementCommand.execute()` and check that `doubled.get()` returns `2`. The React version of the starter reads these values through a one-line hook. The Vue, Svelte, Solid, Lit and vanilla starters each use their own equally small bridge. The ViewModel itself never changes.

## Borrowing from Prism, on purpose

I didn't try to be original about the vocabulary. Where Prism already had a good name for an idea, Web Loom kept the idea:

- Prism's `DelegateCommand` → Web Loom's `Command` (`mvvm-core`)
- Prism's `CompositeCommand` → `CompositeCommand` (`mvvm-core`)
- Prism's `BindableBase` → `BaseModel` and `BaseViewModel` (`mvvm-core`)
- Prism's Event Aggregator → `EventBus` (`event-bus-core`)
- Prism's Modules → plugin modules (`plugin-core`)

Some ideas needed adapting. Prism's _regions_, for example, became shell and layout patterns in `ui-patterns`, because the web composes screens differently from a desktop window. But anyone who has written a Prism application should feel at home quickly, and anyone who hasn't gets names that have been tested in real projects for years.

## What's in the repo today

The playground grew in every direction. Here is a rough tour.

**Core architecture.** `mvvm-core` provides models, ViewModels, commands and observable collections. `mvvm-patterns` adds higher-level conversations between ViewModels and Views, such as interaction requests and "active-aware" ViewModels.

**Reactivity and state.** `signals-core` is a small, dependency-free signals library that everything else is built on. `store-core` holds UI-only state such as the theme or whether the sidebar is open. `query-core` handles data fetching and caching. `event-bus-core` and `event-emitter-core` provide typed messaging.

**Behaviour and design.** `ui-core` contains headless UI behaviours (dialogs, lists, forms, roving focus) with no markup or styles. `ui-patterns` composes them into larger shells like a wizard, a master–detail view and a command palette. `design-core` provides design tokens and theming.

**Templating.** Most recently, `template-core` is a small template engine whose bindings _are_ signal subscriptions, so a ViewModel can drive the DOM with no framework at all. It is still experimental, and Part 3 covers it in more detail.

**Demo apps.** The same ViewModels drive apps written in React, Vue, Angular, Solid, Lit, Marko, vanilla JavaScript, React Native and Web Loom's own templates.

**What moved out.** The repo used to be bigger. Framework-specific adapters (React UI components, form bindings for React, Vue and vanilla JS, media players and charts) now live in a sibling repo, [web-loom-extensions](https://github.com/bretuobay/web-loom-extensions). It installs the core packages from npm like any other user would. That split keeps the main repo honest: everything in it has to work without a particular framework.

Eleven packages are published on npm under the `@web-loom` scope. There is also a starter CLI:

```bash
npm create web-loom@latest
```

And there is a lot of writing:

- **[The documentation](https://webloomframework.com/docs)**, starting with [Getting Started](https://webloomframework.com/docs/getting-started).
- **[The blog series](https://webloomframework.com/blog)**, with one article per core package, starting with [The Architecture Layer the Web Forgot](https://webloomframework.com/blog/01-mvvm-core).
- **[The book](https://webloomframework.com/book)**, 23 chapters going from [The Frontend Architecture Crisis](https://webloomframework.com/book/chapter1) through framework-by-framework implementations to testing, plugins and design systems.

## What it isn't

Let me be clear about this before going further. Web Loom is not trying to replace your favourite framework. React, Vue, Angular and the rest are excellent at what they do, which is rendering and their ecosystems. Web Loom sits _beside_ them and asks where your business logic should live.

It is also an exploration, not a battle-tested enterprise platform. Some packages are polished, some are rough, and the APIs are still pre-1.0. I'm sharing it because I find the ideas genuinely interesting, and because writing it down forces me to check whether they hold up.

MVVM isn't free, either. It adds classes and indirection that a small app doesn't need. A landing page doesn't need a ViewModel. The trade starts to pay off when an app grows, when several people (or several AI agents) work on it, or when the same logic has to live in more than one front end.

## Where this series goes next

This first part covered the _why_ and the _what_. The rest of the series covers the parts of the journey I found most interesting:

- **[Part 2 — From RxJS to Signals](https://webloomframework.com/blog/from-rxjs-to-signals).** Web Loom's reactive layer started on RxJS. I explain why, what hurt, and why I moved everything to signals now that frameworks have adopted them and they've been proposed for JavaScript itself.
- **[Part 3 — One ViewModel, Many Views](https://webloomframework.com/blog/one-viewmodel-many-views).** A single ViewModel rendered by React, Vue, vanilla JavaScript and a framework-free template, then tested without a DOM.
- **[Part 4 — Patterns in the Age of Agentic Coding](https://webloomframework.com/blog/patterns-in-the-age-of-agentic-coding).** Most of Web Loom's code was written by AI. I cover how that worked, what guardrails made it work, and why I think knowing patterns matters _more_ now, not less.

If you'd like to look around before then, the code is on [GitHub](https://github.com/bretuobay/web-loom) and everything else is at [webloomframework.com](https://webloomframework.com).

---

_Next in the series: **[Part 2 — From RxJS to Signals](https://webloomframework.com/blog/from-rxjs-to-signals)**._
