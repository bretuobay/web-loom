# React Integration Guide

## Setup

Import and use the `useI18n` hook from `examples/react/useI18n.ts`.

## Example

```typescript
import { useI18n, I18nContext, LocaleSwitcher } from '../../examples/react/useI18n';

const config = {
  /* ... */
};
const { locale, setLocale, t } = useI18n(config);
```
