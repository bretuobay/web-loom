// tests/mocks/mockFetch.ts

type FetchHandler = (
  url: RequestInfo | URL,
  options?: RequestInit,
) =>
  | Promise<Response>
  | { data?: any; error?: any; ok?: boolean; status?: number; statusText?: string; headers?: Record<string, string> };

interface FetchCall {
  url: RequestInfo | URL;
  options?: RequestInit;
}

let originalFetch: typeof window.fetch;
let currentHandler: FetchHandler | null = null;
const fetchCalls: FetchCall[] = [];

export function mockFetch(handler?: FetchHandler) {
  if (!originalFetch) {
    originalFetch = window.fetch;
  }
  fetchCalls.length = 0; // Clear previous calls

  currentHandler = handler || (() => ({ ok: true, status: 200, data: {} }));

  window.fetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    fetchCalls.push({ url, options });
    if (!currentHandler) {
      // Should not happen if setup correctly, but as a fallback:
      return originalFetch(url, options);
    }

    const result = await Promise.resolve(currentHandler(url, options));

    if (result instanceof Response) {
      return result;
    }

    const {
      data,
      error,
      ok = true,
      status = 200,
      statusText = 'OK',
      headers = { 'Content-Type': 'application/json' },
    } = result;

    if (error) {
      // Simulate network error or error response
      // For actual network error, fetch throws. For error responses, it doesn't.
      // This mock simplifies by having 'ok: false' for error responses.
      return new Response(JSON.stringify(error), {
        status: status || 500,
        statusText: statusText || 'Internal Server Error',
        headers: new Headers(headers),
      });
    }

    return new Response(data !== undefined ? JSON.stringify(data) : null, {
      status,
      statusText,
      headers: new Headers(headers),
    });
  };
}

export function resetFetch() {
  if (originalFetch) {
    window.fetch = originalFetch;
  }
  currentHandler = null;
  fetchCalls.length = 0;
}

export function getFetchCalls(): FetchCall[] {
  return [...fetchCalls];
}

export function getLastFetchCall(): FetchCall | undefined {
  return fetchCalls.length > 0 ? fetchCalls[fetchCalls.length - 1] : undefined;
}
