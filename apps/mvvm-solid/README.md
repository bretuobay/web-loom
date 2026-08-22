# Solid + TypeScript + Vite

This app is the SolidJS twin of [`apps/mvvm-react`](../mvvm-react): the same greenhouse IoT dashboard, the same `@repo/view-models`, a different View.

# MVVM in Solid

Solid and `@web-loom/signals-core` are both pull-based signal systems, but they are **not the same graph**. Web Loom ViewModels stay framework-agnostic — they never import `solid-js`. The View mirrors those signals into Solid accessors, then uses Solid's compiler (`<Show>`, `<For>`, `createMemo`, native `createSignal` for form state) for fine-grained DOM updates.

That is the point of the demo: you can keep MVVM + `signals-core` for Models/ViewModels/Commands, and still use Solid the way Solid is meant to be used.

## Two signal systems, one boundary

| Layer                       | Reactive primitive                                              | Why                                                                                  |
| --------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Model / ViewModel / Command | `@web-loom/signals-core` (`data$`, `isLoading$`, `canExecute$`) | Shared with React, Vue, Angular, Lit, Vanilla                                        |
| View                        | Solid `createSignal` / `createMemo` / JSX                       | Fine-grained updates; component functions run once                                   |
| Bridge                      | `useSignal(sig)` in `src/hooks/useSignal.ts`                    | `observe()` copies the current value, then every later change, into a Solid accessor |

Do **not** read a loom signal with `.get()` inside `createMemo` or JSX and expect Solid to re-run. Loom tracking only works inside loom `computed`/`effect` contexts. The bridge exists because the graphs do not compose.

Solid's built-in `from()` is also not a drop-in: it waits for the first `subscribe()` callback, and loom `subscribe()` does not emit the current value. `useSignal` uses `observe()` (peek + subscribe) to close that gap.

```ts
import { createSignal, onCleanup, type Accessor } from 'solid-js';
import { observe, type ReadonlySignal } from '@web-loom/signals-core';

export function useSignal<T>(source: ReadonlySignal<T>): Accessor<T> {
  const [value, setValue] = createSignal(source.peek());
  const stop = observe(source, (next) => {
    setValue(() => next);
  });
  onCleanup(stop);
  return value;
}
```

## What stays in Solid (view-only)

The greenhouse form does **not** live on the ViewModel. Draft fields (`name`, `location`, `size`, `cropType`, `editingId`) are native Solid signals so typing a letter updates one input, not the page. Derived loading on the dashboard is a Solid `createMemo` over the bridged accessors. Lists use `<For>` so inserting a greenhouse patches one `<li>`.

Commands stay on the ViewModel:

```ts
greenHouseViewModel.fetchCommand.execute();
greenHouseViewModel.createCommand.execute(data);
greenHouseViewModel.updateCommand.execute({ id, payload });
greenHouseViewModel.deleteCommand.execute(id);
```

## Dashboard (same ViewModels as React/Vue)

```tsx
const greenHouses = useSignal(greenHouseViewModel.data$);
const isLoadingGreenHouses = useSignal(greenHouseViewModel.isLoading$);
// ...sensors, readings, alerts

const isLoading = createMemo(
  () => isLoadingGreenHouses() || isLoadingSensors() || isLoadingSensorReadings() || isLoadingThresholdAlerts(),
);

onMount(() => {
  void greenHouseViewModel.fetchCommand.execute();
});
```

## Getting Started

The API (`apps/api`, port 8000) must be running — same as the other MVVM demos.

```bash
# from repo root
npm run demo:start -- --frontends=mvvm-solid

# or
cd apps/mvvm-solid && npm run dev
```

Dev server: **http://localhost:5179**

## Project structure

- `src/hooks/useSignal.ts` — loom → Solid bridge
- `src/components/` — Views (Dashboard, lists, cards)
- `src/layout/` — Header / Footer / Container
- Shared ViewModels: `@repo/view-models/*`
- Shared styles: `@repo/shared/styles`
