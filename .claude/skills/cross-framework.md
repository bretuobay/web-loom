# Cross-Framework Development

Patterns for implementing features across multiple frontend frameworks.

## Implementation Steps

1. Add business logic to a ViewModel in `packages/view-models/` or extend `BaseViewModel`
2. If data comes from API, extend `RestfulApiModel` for the Model
3. Implement View layer in each framework app (`apps/mvvm-*`)
4. Subscribe to ViewModel observables using framework-specific patterns

## Framework-Specific Subscriptions

### React

```typescript
useEffect(() => {
  const subscription = viewModel.data$.subscribe(setData);
  return () => subscription.unsubscribe();
}, [viewModel]);
```

### Angular

```html
<div *ngIf="viewModel.data$ | async as data">
  {{ data.name }}
</div>
```

### Vue

```typescript
watchEffect(() => {
  viewModel.data$.subscribe((data) => {
    state.value = data;
  });
});
```

### Lit

```typescript
@state() private data: DataType;

connectedCallback() {
  super.connectedCallback();
  this.subscription = viewModel.data$.subscribe(
    (data) => this.data = data
  );
}
```

### Vanilla JS

```typescript
const subscription = viewModel.data$.subscribe((data) => {
  renderTemplate(data);
});
// Manual cleanup on unmount
subscription.unsubscribe();
```

## Best Practices

- Keep ViewModels framework-agnostic
- Use observables for all reactive state
- Always clean up subscriptions
- Share validation logic via Zod schemas
