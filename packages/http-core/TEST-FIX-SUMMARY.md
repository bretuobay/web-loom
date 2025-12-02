# Test Fix Summary - @web-loom/http-core

## Issue Encountered

After implementing all P0 gap fixes, tests were initially failing due to two issues:

1. **Node.js Version Incompatibility** (Primary)
   - Environment was running Node v15.14.0
   - Vite 6.1.1 requires Node v18+
   - Error: `SyntaxError: Invalid regular expression flags`

2. **Timeout Tests Failing** (Secondary)
   - 5 timeout-related tests failing after Node upgrade
   - Mock adapter delays weren't being interrupted by timeouts
   - Tests expected timeouts but requests were completing successfully

## Root Cause

The timeout mechanism in `client.ts` was set up **after** the mock adapter was called, meaning:

1. Mock adapter would execute with delays via `sleep()`
2. Timeout/AbortController was only configured for real `fetch()` calls
3. Mock delays couldn't be interrupted by timeout or cancellation

**Before Fix:**
```typescript
// Mock adapter called first
if (this.config.mockAdapter) {
  const mockResponse = await this.config.mockAdapter.mock(config);
  // ... handle response
}

// Timeout setup happened AFTER mock
const controller = new AbortController();
if (config.timeout) {
  timeoutId = setTimeout(() => controller.abort(), config.timeout);
}
```

## Solution Implemented

### 1. Moved Timeout Setup Earlier (`client.ts`)

Moved the AbortController and timeout setup **before** the mock adapter call:

```typescript
// Setup timeout FIRST
const controller = new AbortController();
const signal = config.signal || controller.signal;
let timeoutId: NodeJS.Timeout | undefined;

if (config.timeout) {
  timeoutId = setTimeout(() => controller.abort(), config.timeout);
}

// Then check mock adapter
if (this.config.mockAdapter) {
  // Pass signal to mock
  const configWithSignal = { ...config, signal };
  const mockResponse = await this.config.mockAdapter.mock(configWithSignal);
  // ...
}
```

### 2. Made Mock Adapter Abort-Aware (`mock.ts`)

Added `sleepWithAbort()` method to support cancellation during delays:

```typescript
private sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already aborted
    if (signal?.aborted) {
      reject(new DOMException('The operation was aborted', 'AbortError'));
      return;
    }

    const timeoutId = setTimeout(resolve, ms);

    // Listen for abort event
    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException('The operation was aborted', 'AbortError'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });

    // Clean up listener when done
    setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
    }, ms);
  });
}
```

### 3. Updated Mock Delay Logic

Changed from non-cancellable `sleep()` to abort-aware delay:

```typescript
// Simulate network delay with abort support
if (mockResponse.delay) {
  await this.sleepWithAbort(mockResponse.delay, config.signal);
}
```

## Files Modified

1. **`src/client.ts`**
   - Moved timeout/AbortController setup before mock adapter call
   - Pass signal to mock adapter in config
   - Check abort signal before mock execution

2. **`src/mock.ts`**
   - Removed unused `sleep` import from `retry.ts`
   - Added `sleepWithAbort()` private method
   - Updated `mock()` to use `sleepWithAbort()` instead of `sleep()`

## Test Results

### Before Fix
```
Test Files  1 failed | 6 passed (7)
     Tests  5 failed | 73 passed (78)
```

**Failed Tests:**
- ✗ should timeout if request takes too long
- ✗ should allow per-request timeout override (first call)
- ✗ should cancel request using AbortController
- ✗ should handle already aborted signal
- ✗ should handle multiple requests with different timeouts

### After Fix
```
Test Files  7 passed (7)
     Tests  78 passed (78)
  Duration  ~2s
```

✅ **All timeout tests now passing**
✅ **All cancellation tests now passing**
✅ **All other tests remain passing**

## Verification

```bash
# TypeScript compilation
npx tsc --noEmit
# ✅ No errors

# Run tests
npm test
# ✅ 78/78 passing

# Test coverage
npm run test:coverage
# ✅ 67.91% coverage on src/ directory
```

## Key Learnings

1. **Mock adapters need abort signal support** to properly test timeout/cancellation scenarios
2. **Timeout setup must happen before any async operations** (mock or real fetch)
3. **Sleep functions used in testing must be cancellable** to work with AbortController
4. **Pass abort signals through the entire request chain** for proper cancellation support

## Impact

✅ Proper timeout behavior in both mock and real environments
✅ Accurate testing of edge cases (timeout, cancellation)
✅ Better alignment between mock and production behavior
✅ No breaking changes to public API

---

**Completed:** December 2, 2025
**Node Version:** v23.11.1 (npm v10.9.2)
**Test Suite:** All 78 tests passing
**TypeScript:** Compilation successful
