import { describe, it, expect, beforeEach, afterEach, vi, SpyInstance } from 'vitest';
import { GlobalErrorService, HandledError } from './global-error-service';
import { Subject, firstValueFrom } from 'rxjs'; // Keep firstValueFrom from rxjs directly

describe('GlobalErrorService', () => {
  let service: GlobalErrorService;
  // let mockErrorSubject$: Subject<HandledError>; // Not strictly needed if testing public API

  // Mock console.error
  let consoleErrorSpy: SpyInstance;

  // Mocks for global event listeners
  // Vitest's vi.spyOn can work on global objects like window and process
  let mockWindowAddEventListener: SpyInstance | undefined;
  let mockWindowRemoveEventListener: SpyInstance | undefined; // If testing removal
  let mockProcessOn: SpyInstance | undefined;
  let mockProcessRemoveListener: SpyInstance | undefined; // If testing removal

  const originalWindow = global.window;
  const originalProcess = global.process;

  beforeEach(() => {
    // Spy on console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock browser environment
    if (typeof window !== 'undefined') {
        mockWindowAddEventListener = vi.spyOn(window, 'addEventListener');
        // mockWindowRemoveEventListener = vi.spyOn(window, 'removeEventListener');
    } else { // Simulate browser environment for tests if not present
        global.window = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        } as any;
        mockWindowAddEventListener = vi.spyOn(global.window, 'addEventListener');
        // mockWindowRemoveEventListener = vi.spyOn(global.window, 'removeEventListener');
    }

    // Mock Node.js environment
    if (typeof process !== 'undefined' && typeof process.on === 'function') {
        mockProcessOn = vi.spyOn(process, 'on');
        // mockProcessRemoveListener = vi.spyOn(process, 'removeListener');
    } else { // Simulate Node.js process for tests if not present
        global.process = {
            on: vi.fn(),
            removeListener: vi.fn(),
        } as any;
        mockProcessOn = vi.spyOn(global.process, 'on');
        // mockProcessRemoveListener = vi.spyOn(global.process, 'removeListener');
    }

    service = new GlobalErrorService();
  });

  afterEach(() => {
    service.dispose();
    consoleErrorSpy.mockRestore();

    mockWindowAddEventListener?.mockRestore();
    // mockWindowRemoveEventListener?.mockRestore();
    mockProcessOn?.mockRestore();
    // mockProcessRemoveListener?.mockRestore();

    // Restore original globals if they were changed
    global.window = originalWindow;
    global.process = originalProcess;
    vi.clearAllMocks(); // Clear all mocks including spies
  });

  it('should initialize without errors', () => {
    expect(service).toBeInstanceOf(GlobalErrorService);
  });

  it('handleError should log the error to console', () => {
    const testError = new Error('Test error message');
    service.handleError(testError, 'TestContext');

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('[TestContext] Global Error:', testError);
  });

  it('handleError should log without context if not provided', () => {
    const testError = { message: 'Plain object error' };
    service.handleError(testError);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Global Error:', testError);
  });

  it('handleError should emit the error on uncaughtErrors$ observable', async () => {
    const testError = new Error('Observable test error');
    const testContext = 'ObservableContext';

    const errorPromise = firstValueFrom(service.uncaughtErrors$); // Get a promise for the first emitted error
    service.handleError(testError, testContext);
    const handledError = await errorPromise;

    expect(handledError.error).toBe(testError);
    expect(handledError.context).toBe(testContext);
    expect(handledError.timestamp).toBeInstanceOf(Date);
    expect(handledError.processed).toBe(false); // Default
  });

  it('multiple subscribers should receive the error', async () => {
    const testError = new Error('Multi-subscriber test');
    const errorPromise1 = firstValueFrom(service.uncaughtErrors$);
    const errorPromise2 = firstValueFrom(service.uncaughtErrors$); // Subject will multicast

    service.handleError(testError, 'MultiContext');

    const handledError1 = await errorPromise1;
    const handledError2 = await errorPromise2;

    expect(handledError1.error).toBe(testError);
    expect(handledError2.error).toBe(testError);
  });


  it('dispose should complete the uncaughtErrors$ observable', async () => {
    let isCompleted = false;
    const subscription = service.uncaughtErrors$.subscribe({
      complete: () => {
        isCompleted = true;
      },
    });
    service.dispose();

    // Check completion asynchronously if needed, or trust that .complete() works
    // For a Subject, once complete, new subscriptions also complete immediately.
    // We can test this by trying to subscribe after completion or checking a flag.
    await new Promise(resolve => setTimeout(resolve,0)); // allow microtasks to run
    expect(isCompleted).toBe(true);
    subscription.unsubscribe();
  });

  describe('Global Error Handler Setup', () => {
    it('should attempt to setup browser global error handlers if window is defined', () => {
        service.dispose();
        const tempWindow = global.window;
        if(!global.window) global.window = { addEventListener: vi.fn() } as any;

        mockWindowAddEventListener = vi.spyOn(global.window, 'addEventListener');
        service = new GlobalErrorService(); // Re-init with mocked window

        expect(mockWindowAddEventListener).toHaveBeenCalledWith('error', expect.any(Function));
        expect(mockWindowAddEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

        global.window = tempWindow;
    });

    it('should attempt to setup Node.js global error handlers if process is defined and window is not', () => {
        service.dispose();

        const tempWindow = global.window;
        const tempProcess = global.process;
        delete (global as any).window;
        if(!global.process || !global.process.on) global.process = { on: vi.fn() } as any;

        mockProcessOn = vi.spyOn(global.process, 'on');
        service = new GlobalErrorService(); // Re-init

        expect(mockProcessOn).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
        expect(mockProcessOn).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));

        global.window = tempWindow;
        global.process = tempProcess;
    });

    it('browser "error" event handler should call handleError', () => {
        service.dispose();
        const tempWindow = global.window;
        if(!global.window) global.window = { addEventListener: vi.fn() } as any;
        mockWindowAddEventListener = vi.spyOn(global.window, 'addEventListener');
        service = new GlobalErrorService();

        const errorHandler = mockWindowAddEventListener?.mock.calls.find(call => call[0] === 'error')?.[1];
        expect(errorHandler).toBeDefined();

        const mockErrorEvent = {
            message: 'A wild error appeared!',
            error: new Error('Wild Error'),
            filename: 'test.js'
        } as ErrorEvent;

        const handleErrorSpy = vi.spyOn(service, 'handleError');
        if (errorHandler) {
            errorHandler(mockErrorEvent);
        }

        expect(handleErrorSpy).toHaveBeenCalledWith(mockErrorEvent.error, `window.onerror: ${mockErrorEvent.filename}`);
        handleErrorSpy.mockRestore();
        global.window = tempWindow;
    });

    it('browser "unhandledrejection" event handler should call handleError', () => {
        service.dispose();
        const tempWindow = global.window;
        if(!global.window) global.window = { addEventListener: vi.fn() } as any;
        mockWindowAddEventListener = vi.spyOn(global.window, 'addEventListener');
        service = new GlobalErrorService();

        const rejectionHandler = mockWindowAddEventListener?.mock.calls.find(call => call[0] === 'unhandledrejection')?.[1];
        expect(rejectionHandler).toBeDefined();

        const mockRejectionEvent = { reason: 'Promise rejected badly' } as PromiseRejectionEvent;

        const handleErrorSpy = vi.spyOn(service, 'handleError');
        if (rejectionHandler) {
            rejectionHandler(mockRejectionEvent);
        }

        expect(handleErrorSpy).toHaveBeenCalledWith(mockRejectionEvent.reason, 'window.onunhandledrejection');
        handleErrorSpy.mockRestore();
        global.window = tempWindow;
    });


    it('browser "error" event handler should suppress ResizeObserver loop limit error', () => {
        service.dispose();
        const tempWindow = global.window;
        if(!global.window) global.window = { addEventListener: vi.fn() } as any;
        mockWindowAddEventListener = vi.spyOn(global.window, 'addEventListener');
        service = new GlobalErrorService();

        const errorHandler = mockWindowAddEventListener?.mock.calls.find(call => call[0] === 'error')?.[1];
        const mockResizeObserverErrorEvent = { message: 'ResizeObserver loop limit exceeded' } as ErrorEvent;

        const handleErrorSpy = vi.spyOn(service, 'handleError');
        if (errorHandler) {
            errorHandler(mockResizeObserverErrorEvent);
        }

        expect(handleErrorSpy).not.toHaveBeenCalled();
        handleErrorSpy.mockRestore();
        global.window = tempWindow;
    });
  });
});
