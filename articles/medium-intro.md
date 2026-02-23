# The Frontend Framework Treadmill, and One Attempt to Get Off It

---

You've been here. The tech lead says the team is moving to a new framework — maybe Vue is replacing React, maybe you're adding a React Native mobile app to an existing web codebase — and someone opens the old repository to assess the effort involved.

What follows is a quiet kind of dread.

The business logic isn't in one place. It's threaded through custom hooks that call context providers that dispatch Redux actions that trigger side effects in useEffect blocks. The async state management is split between the component, a custom hook, and a global store. The validation logic is duplicated across three features because nobody could agree on where it belonged. The loading flags are managed by whoever wrote that file last.

The assessment comes back: this isn't a migration. This is a rewrite.

Nobody made bad decisions intentionally. The codebase was built incrementally, with reasonable choices made week by week. But the architecture — if it can be called that — has no concept of what belongs where. And without that concept, there's nothing to carry forward.

I've been thinking about why this happens so consistently, and whether there's a better way. What follows is my attempt to think through it honestly.

---

## This Isn't a New Problem

The architectural question — how do you separate what your application *knows* from how it *looks* — is not new. It was solved, in a reasonably durable form, in 2005.

John Gossman was an architect at Microsoft working on WPF (Windows Presentation Foundation). He wrote a blog post introducing Model–View–ViewModel as the pattern for WPF applications. The insight at its core was modest but important: the logic that decides what to display — loading states, derived values, formatted data — has nothing inherently to do with the rendering layer. You can write it as a plain class, test it in isolation, and connect it to any UI that knows how to subscribe to its output.

Knockout.js brought this pattern to the browser in 2010. Years before React. Developers building data-heavy web applications in that era had ViewModels with observable properties, declarative bindings, and clean separation between their data layer and their templates. It worked. The codebases were testable, predictable, and relatively easy to migrate when technology changed.

That era is easy to forget, but the pattern didn't go away. It went everywhere else.

Today, MVVM is the standard in every major non-web UI platform. Android's official architecture guide is built on Jetpack's `ViewModel` and `StateFlow` — that's MVVM. SwiftUI uses `ObservableObject` and `@Published` — MVVM with Swift syntax. WPF and .NET MAUI are so thoroughly MVVM that the community toolkit ships `ObservableObject` and `RelayCommand` as first-class abstractions. Avalonia, the cross-platform .NET UI framework, documents MVVM as the recommended approach. Flutter's BLoC and Riverpod patterns are MVVM in different clothes.

These platforms weren't sentimental about the pattern. They chose it because it solves a real, hard problem that doesn't go away when your language or renderer changes: keeping what your app knows decoupled from how it currently shows it.

---

## The Web Forgot

React arrived in 2013 and the frontend community largely left everything before it behind. What followed was, honestly, impressive in its inventiveness and exhausting in its pace.

Flux. Then Redux. Then MobX. Then Context and `useReducer`. Then Zustand, Jotai, Recoil, Valtio, XState, TanStack Query, SWR, Nanostores. The list keeps growing.

I want to be careful here, because most of these libraries are genuinely clever. Their authors were solving real problems. But step back and look at them as a group, and you notice something: they're all working on the same question. Where does async state live? How do components know when data changed? How do you separate side effects from rendering? These are the questions MVVM answered in 2005. The web community spent a decade rediscovering them from scratch, with fresh branding each time.

Part of this is React's own design. Early React blurred the layers — you fetched data in `componentDidMount`, you managed loading state with `setState`, you put business logic in the component because that's where you were already working. The component became a bucket for everything. The community followed that model, built tools around it, and arrived at the situation we have now: business logic scattered across files, tightly coupled to framework primitives, and essentially non-portable.

Part of this is the web platform itself, which has genuine complexity that desktop doesn't face — server-side rendering, streaming, hydration, edge functions. These are real constraints that push architecture in directions mobile platforms never had to consider.

And part of it, honestly, is just enthusiasm for novelty. New library, new mental model, new conference talk. The web community is not short on smart people who enjoy building things.

The result, though, is that the average web codebase has no clear architectural seam between "business logic" and "rendering logic." When a migration comes, there's nothing portable to lift out. The team rewrites, rebuilds the same logic in the new paradigm, and waits for the next migration cycle to begin.

---

## Enter Web Loom — A Bet, Not a Silver Bullet

Web Loom is an open-source monorepo I've been building that tries to take the MVVM approach seriously on the web and demonstrate what it looks like in practice.

It currently has 34 packages in the monorepo, 10 of which are published to npm. The core idea is straightforward: only the View layer is framework-specific. Roughly 20% of a typical codebase — the components that render markup and subscribe to state changes — needs to know about React or Vue or Angular. The other 80% — Models, ViewModels, form logic, HTTP utilities, event bus, storage abstractions — can be written in plain TypeScript with no framework imports whatsoever.

The monorepo demonstrates this across React, Vue, Angular, Lit, Marko, vanilla JavaScript, and React Native. The ViewModels are the same in every case. Only the subscription syntax in the View differs.

I want to be direct about what this is and isn't. It's an experiment and a demonstration. It's not production-proven at scale. Some of the packages are still rough. The RxJS learning curve is real. There are architectural tradeoffs I'll get to.

But I think the underlying question it's asking is worth asking: can the web adopt the same architectural discipline that Android and iOS and .NET have been quietly benefiting from for twenty years?

---

## The Architecture in Plain English

The pattern is three layers, with strict responsibilities at each boundary.

**The Model** knows about data. It talks to APIs, holds raw state, and exposes it through reactive streams — observables or signals. It does not know the UI exists. It has no React imports, no Vue imports, no Angular imports. If you test it, you mock `fetch` and assert on the state it emits. That's it.

**The ViewModel** knows what the View needs to display. It takes the raw data from the Model, derives the presentation state from it — formatted values, loading flags, counts, filtered lists — and exposes it as observable properties. It also exposes Commands: objects that wrap async operations and manage their own loading and error state. The ViewModel has no framework imports either.

**The View** is thin. It subscribes to ViewModel properties and renders them. When a user acts, it calls a ViewModel Command. The View contains no `try/catch`, no loading flags, no business logic of any kind. It's the only place where React or Vue or Angular code lives.

Here's a small example of what the same ViewModel looks like wired to React and Vue:

```typescript
// This ViewModel class is identical in both cases.
class TaskListViewModel extends BaseViewModel<TaskModel> {
  readonly fetchCommand = this.registerCommand(
    new Command(async () => this.model.fetchAll())
  );
  readonly pendingCount$ = this.data$.pipe(
    map(tasks => (tasks ?? []).filter(t => !t.done).length)
  );
}
```

```tsx
// React View
const tasks   = useObservable(vm.tasks$, []);
const pending = useObservable(vm.pendingCount$, 0);
// ...
<button onClick={() => vm.fetchCommand.execute()}>Refresh</button>
```

```vue
<!-- Vue View -->
<script setup>
vm.tasks$.subscribe(v => tasks.value = v);
onMounted(() => vm.fetchCommand.execute());
</script>
```

The Command pattern is worth pausing on. Rather than the View calling an async function directly and managing loading state with local `useState`, the View calls `vm.fetchCommand.execute()`. The Command exposes `isExecuting$` for the loading spinner and `executeError$` for error handling. The View just binds to those. It doesn't manage try/catch. It doesn't track loading booleans. It just subscribes and renders.

The testability benefit here is not theoretical. Because the ViewModel has no framework imports, you can test it with plain Vitest — no DOM, no component mounting, no test renderer. You instantiate the class, feed it data, and assert on its observable output. This is the kind of test that's fast, stable, and actually covers the logic that matters.

---

## Why This Matters Even More With AI

LLMs have made it faster than ever to write code. I find this genuinely useful. A feature that used to take a day sometimes takes an hour. The speed is real.

But it compounds the architecture problem in a way I didn't anticipate when AI coding tools first became widely available.

An LLM generates code that fits the context it's given. If you hand it a codebase where business logic is scattered across components, where state management is inconsistent, where there's no clear answer to "where does a new async operation go?" — it generates code that follows the same patterns. It copies what it sees. If the codebase is messy, the generated code is messy, and now you have more messy code faster than you would have otherwise.

Good architecture works the opposite way. When the layers are clearly defined and the responsibilities are unambiguous, AI-generated code slots in naturally. "Add a new field to the ViewModel" is a specific, bounded task. The LLM knows what a ViewModel is in this codebase, knows it lives in a particular place, knows it exposes a particular interface. The output is coherent with everything around it.

I'm not saying architecture exists to make AI work better. That's the wrong framing. The point is that good architecture makes the codebase survivable — by humans and agents alike — over time. It reduces the cognitive overhead of figuring out where things go, which benefits everyone who touches the code, whether or not they were born in a data center.

The architectural discipline that mobile platforms figured out twenty years ago was valuable before LLMs existed. The accelerated pace of AI-assisted development just makes it more valuable now.

---

## What's in the Box

The packages published to npm today under the `@web-loom/` scope:

- **`@web-loom/mvvm-core`** — the core library: `BaseModel`, `BaseViewModel`, `Command`, `CompositeCommand`, `RestfulApiModel`, `RestfulApiViewModel`, and the dispose pattern
- **`@web-loom/signals-core`** — a lightweight reactive signals implementation with `signal`, `computed`, and `effect`, zero dependencies
- **`@web-loom/query-core`** — data fetching and caching with stale-while-revalidate behaviour
- **`@web-loom/store-core`** — a minimal store for UI-only state (theme, sidebar open/closed, active tab) with persistence adapters
- **`@web-loom/event-bus-core`** — typed pub/sub for cross-feature communication without coupling ViewModels directly
- **`@web-loom/event-emitter-core`** — typed event emitter utilities
- **`@web-loom/ui-core`** — headless UI behaviours: Dialog, Form, List, roving focus — no markup, no styles
- **`@web-loom/ui-patterns`** — composed shells: Wizard, MasterDetail, CommandPalette
- **`@web-loom/design-core`** — design tokens, CSS custom properties, and theming utilities
- **`@web-loom/mvvm-patterns`** — higher-level patterns: `InteractionRequest`, `ActiveAwareViewModel`

Still in progress, not yet on npm: form logic, media player, HTTP utilities, storage, router, i18n, notifications, error handling, platform detection, typography, and charts. Most of the infrastructure is written and working in the monorepo; getting to a clean stable API for each package takes time.

The monorepo itself is the fullest demonstration of how these pieces fit together across React, Vue, Angular, Lit, Marko, vanilla JS, and React Native.

---

## Food for Thought, Not a Prescription

I want to end honestly rather than with a pitch.

The patterns in Web Loom are not new. That's actually the point. MVVM has been quietly solving the same problems on Android, iOS, and .NET for two decades. The proposition is not that Web Loom invented something clever — it's that the web might benefit from borrowing something that has already proven itself elsewhere.

But there are real tradeoffs. RxJS has a learning curve, and for teams not already familiar with it, the entry cost is non-trivial. MVVM is more verbose than putting everything in a component — you're maintaining separate classes where a simple app might only need a hook. Not every project needs this level of structure. A prototype, a landing page, a small tool built for personal use — adding a ViewModel layer would be overhead, not benefit.

The 80/20 split — only 20% of a codebase is framework-specific — is an architectural goal, not a promise. It requires discipline to maintain, and discipline costs effort. The benefit compounds over time, especially across migrations and growing teams, but it's not free.

I'm also aware that I'm one person with one perspective. The web's pattern diversity partly reflects genuine disagreement about what the right approach is. Reasonable engineers have built good products with every state management library I mentioned earlier. The "right" architecture is context-dependent, and I don't think Web Loom is the right choice for every context.

What I do think is that the question is underasked: *should the web have the same architectural continuity that mobile and desktop platforms achieved?* Not "should everyone use MVVM specifically" — but "is there value in a stable, cross-framework layer of business logic that survives when the rendering layer changes?"

The monorepo is open. The docs are live. If you've had similar frustrations, or if you think I'm wrong about where web architecture has landed, I'd genuinely like to hear it.

The experiment is ongoing.
