# API Reference: Core Functions

## detectBrowserLocale()

Detects the user's browser locale using the browser's `navigator.language` property.

**Example:**

```typescript
detectBrowserLocale(); // "en-US"
```

## getUserLocales()

Returns an array of the user's preferred locales from the browser.

**Example:**

```typescript
getUserLocales(); // ["en-US", "fr-FR"]
```
