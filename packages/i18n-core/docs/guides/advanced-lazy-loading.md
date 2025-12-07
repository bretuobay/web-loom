# Lazy Loading Strategies

- Use `TranslationLoader` for async loading and caching
- Example:

```typescript
const loader = new TranslationLoader();
await loader.load('fr-FR', () => fetch('/fr-FR.json').then((r) => r.json()));
```
