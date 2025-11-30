Below is a complete **Product Requirements Document (PRD)** for the **HTTP Client / API Layer**, based on your specifications and aligned with modern frontend platform standards.

---

# **Product Requirements Document (PRD)**

## **HTTP Client / API Layer**

---

## **1. Overview**

Applications communicate heavily with backend APIs—REST, GraphQL, RPC, or internal services. Today, network communication across the system is inconsistent, with each module performing its own fetch implementations. This leads to duplicated logic, inconsistent error handling, and complex onboarding for new developers.

The **HTTP Client / API Layer** aims to create a unified, extensible, and consistent communication layer built on top of **@web-loom/http-core**. It will provide a highly configurable HTTP client similar to Axios, while remaining lightweight and aligned with Web Platform standards.

---

## **2. Goals & Objectives**

### **Primary Goals**

- Provide a **single standardized HTTP client** for all API communication.
- Enable **request/response interceptors** (auth, CSRF, logging, metrics).
- Support **automatic retries** with exponential backoff.
- Support **request cancellation** using AbortController.
- Centralize **error handling and transformation** into predictable formats.
- Provide **mocking tools** for development and testing.
- Support **base URL & global header configuration**.
- Ensure **TypeScript-safe request + response typing**.
- Provide a **clean, succinct API** that focuses on the most commonly used patterns.

### **Secondary Goals**

- Provide request deduplication/throttling.
- Enable environment-based configurations (dev, staging, prod).
- Optionally integrate with query-core for caching and invalidation.

---

## **3. Non-Goals**

- Full GraphQL client replacement.
- Full SDK-level auth system (beyond token/header interceptors).
- WebSocket or SSE communication (handled separately).

---

## **4. Current State**

### **Existing Tools**

- **RestfulApiModel**: exposes a Fetcher abstraction, but not centralized or extensible.
- **query-core**: provides basic fetching but no standardized request pipeline.

### **Current Problems**

- No unified place for:
  - Authentication headers
  - Error handling
  - Retrying behavior
  - Logging/analytics
  - Mocking

- Boilerplate is repeated across features.
- Inconsistent behavior across modules.

---

## **5. Why It Matters**

A unified HTTP client improves:

- **Developer experience**: reduces friction and duplication.
- **Maintainability**: bug fixes and improvements happen in _one place_.
- **Reliability**: ensures consistent retry and error strategies.
- **Security**: ensures tokens, CSRF, and credentials are consistently injected.
- **Testability**: enables full mocking without rewriting network logic.

This is foundational to all modern applications and is required for scaling.

---

## **6. Product Scope**

### **6.1 Unified HTTP Client**

A single instance-based or factory-created client with global configuration:

- Base URL
- Default headers
- Timeouts
- Mode/credentials options (e.g., `same-origin`, `include`)

### **6.2 Interceptor System**

Must support Axios-style interceptors:

**Request interceptors examples:**

- Inject auth token
- Add CSRF headers
- Rewrite URLs
- Log requests
- Transform request payload

**Response interceptors examples:**

- Logging
- Error mapping/unwrapping
- Token refresh handler
- Metrics reporting

### **6.3 Request/Response Transformation**

- Auto-parse JSON
- Case transformation (optional—snake <-> camel)
- Data normalization hooks

### **6.4 Error Handling & Transformation**

Create a unified error object containing:

- status code
- request metadata
- original fetch error
- transformed user-friendly message

Support:

- 429 retry handling
- 5xx recoverable errors
- Intelligent retry delays (exponential backoff)

### **6.5 Retry Support**

Configurable:

- `retry: number | boolean`
- backoff strategy
- retry based on error status
- jittered delays

### **6.6 Request Cancellation**

- Use native `AbortController`
- Provide cancellation tokens or helpers
- Support multi-request cancellation (group cancellation)

### **6.7 Request Deduplication**

Avoid duplicate in-flight requests:

- Cache by URL + payload signature
- Return the same promise to all callers

### **6.8 Mock/Test Support**

- Pluggable mock adapter
- Mock via configuration or environment flag
- Ability to mock both success + error
- Support for record/replay patterns (optional)

### **6.9 TypeScript Typings**

- Typed request/response signatures:

```ts
client.get<User[]>('/users');
```

- Infer types automatically when generics are provided
- Generate consistent `ApiError` type

### **6.10 Clean, Succinct API**

Focus on most common use cases:

```ts
const client = createHttpClient({
  baseURL: '/api',
  headers: { 'X-App': 'web' },
});

client.get('/users');
client.post('/login', { email, password });

const { data } = await client.get<User>('/profile');
```

Avoid overly large API surfaces—keep it intuitive.

---

## **7. Architecture & Integration**

### **Proposed Package**

- **@web-loom/http-core**

This layer will wrap lower-level browser APIs while providing:

- Interceptors
- Retry engine
- Cancellation wrapper
- Configurable instance creation

### **High-Level Architecture Diagram**

```
               +---------------------+
               |   App Feature Code  |
               +---------------------+
                       |
                       v
          +---------------------------------+
          |      HTTP Client Instance       |
          +---------------------------------+
             |    |     |     |      |
             v    v     v     v      v
     Interceptors  Retry  Mock  Error  Cancel
          |         |      |      |      |
          +---------+------+------|------+
                       |
                       v
                fetch() / XHR wrapper
```

---

## **8. Requirements**

### **Functional Requirements**

| ID   | Requirement                                    | Priority |
| ---- | ---------------------------------------------- | -------- |
| FR1  | Centralized HTTP client with instance creation | P0       |
| FR2  | Request interceptors                           | P0       |
| FR3  | Response interceptors                          | P0       |
| FR4  | Automatic retry logic                          | P0       |
| FR5  | Request cancellation via AbortController       | P0       |
| FR6  | Error transformation and standardization       | P0       |
| FR7  | Base URL + default headers                     | P0       |
| FR8  | Request deduplication                          | P1       |
| FR9  | Mock/test adapter                              | P1       |
| FR10 | TypeScript request/response typing             | P0       |
| FR11 | Lightweight Axios-like API surface             | P0       |

### **Non-Functional Requirements**

| Requirement           | Description                          |
| --------------------- | ------------------------------------ |
| Performance           | Must add < 5ms overhead per request  |
| Browser compatibility | Modern browsers; polyfills optional  |
| Bundle size           | Ideally < 10 KB gzip                 |
| Reliability           | Must support offline error detection |

---

## **9. User Stories**

### **As a developer:**

1. _I want to inject auth tokens automatically_ so I don’t have to manually add headers.
2. _I want reliable retry logic_ so transient server failures don’t break the UI.
3. _I want to cancel in-flight requests_ when switching pages or updating filters.
4. _I want a consistent error format_ so I can display friendly messages.
5. _I want easy mocking_ so I can develop UI without backend availability.
6. _I want deduplication_ so multiple identical calls reuse a single network request.

---

## **10. Open Questions**

- Should we support GraphQL request helpers?
- Should we include built-in token refresh logic or leave that to interceptors?
- Should deduplication be global or per-client instance?
- Should we support request batching (e.g., for analytics)?

---

## **11. Appendix**

### **Suggested Package**

- **@web-loom/http-core**
  Provides the foundational extension points for building the interceptor/retry/cancellation engine.

---
