# Changelog

All notable changes to @web-loom/http-core will be documented in this file.

## [0.5.2] - 2025-11-30

### Added
- Complete HTTP client implementation with Axios-like API
- Request/response/error interceptor system
- Automatic retry logic with exponential backoff and jitter
- Request cancellation via AbortController
- Request deduplication to prevent duplicate in-flight requests
- Comprehensive error handling with standardized ApiError
- Mock adapter for testing and development
- Full TypeScript support with generic type safety
- Query parameter handling
- Multiple HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Configurable timeout support
- Base URL and default headers configuration
- Request/response transformation
- Comprehensive test suite (39 tests)
- Complete API documentation
- Usage examples

### Features
- **Lightweight**: < 4KB gzipped
- **Zero dependencies**: Only RxJS as peer dependency
- **TypeScript-first**: Full type safety
- **Modern**: Built on Web Platform standards (fetch API)
- **Flexible**: Highly configurable with sensible defaults
- **Testable**: Built-in mock adapter

### Documentation
- README.md with comprehensive usage guide
- API.md with complete API reference
- examples/basic-usage.ts with 10+ practical examples
- Inline JSDoc comments throughout codebase
