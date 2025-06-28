import { Subject, Observable, filter } from 'rxjs';

export interface HandledError {
  error: any;
  context?: string; // Optional context, e.g., 'ViewModelName.methodName'
  timestamp: Date;
  processed?: boolean; // Flag to indicate if this error has been "seen" or initially processed by a handler
}

export class GlobalErrorService {
  // Using a Subject because we only want to emit *new* errors after subscription.
  // BehaviorSubject would replay the last error, which might not be desired for an error stream.
  private _errorSubject$ = new Subject<HandledError>();

  /**
   * Observable stream of uncaught errors.
   * Subscribers will receive errors that occur *after* they subscribe.
   */
  public readonly uncaughtErrors$: Observable<HandledError> = this._errorSubject$.asObservable();

  /**
   * An alternative observable that also includes a "processed" flag,
   * useful if multiple handlers might see the same error but only one should "claim" it.
   * This is a more advanced use case. For most, uncaughtErrors$ is sufficient.
   */
  public readonly processedErrors$: Observable<HandledError>;


  constructor() {
    // This stream helps manage the 'processed' flag if needed.
    // For simple cases, uncaughtErrors$ is often enough.
    this.processedErrors$ = this._errorSubject$.pipe(
        // Example: One handler could mark error as processed to prevent others from also showing a UI message.
        // tap(error => { if (!error.processed) error.processed = true; })
    );

    // Optional: Setup global listeners for truly unhandled errors
    // This is environment-dependent (browser vs. Node.js) and might need careful consideration.
    this.setupGlobalErrorHandlers();
  }

  /**
   * Call this method to report an error to the global error handling system.
   * @param error The error object or message.
   * @param context An optional string providing context about where the error occurred.
   */
  public handleError(error: any, context?: string): void {
    const handledError: HandledError = {
      error,
      context,
      timestamp: new Date(),
      processed: false,
    };

    // Log to console by default. This could be configurable.
    if (context) {
      console.error(`[${context}] Global Error:`, error);
    } else {
      console.error('Global Error:', error);
    }

    // Emit the error to subscribers.
    this._errorSubject$.next(handledError);

    // Here, you could also integrate with an external error tracking service:
    // e.g., Sentry.captureException(error, { extra: { context, timestamp: handledError.timestamp } });
    // e.g., LogRocket.captureException(error, { extra: { context, timestamp: handledError.timestamp } });
  }

  private setupGlobalErrorHandlers(): void {
    // --- Browser Environment ---
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      // Handles errors thrown synchronously in event handlers or promise chains not caught by .catch()
      window.addEventListener('error', (event: ErrorEvent) => {
        // Filter out some common non-critical errors if needed
        // For example, ResizeObserver loop limit exceeded is often benign.
        if (event.message && event.message.includes('ResizeObserver loop limit exceeded')) {
            // console.warn("GlobalErrorHandler: Suppressed ResizeObserver loop limit error.");
            return;
        }
        this.handleError(event.error || event.message, `window.onerror: ${event.filename || 'unknown file'}`);
        // return true; // To prevent default browser error handling (e.g., console message)
                      // Usually, you want the default handling too, so don't return true unless specific reason.
      });

      // Handles unhandled promise rejections
      window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        this.handleError(event.reason, 'window.onunhandledrejection');
        // event.preventDefault(); // To prevent default browser handling (e.g., console message)
                                // Usually, you want the default handling too.
      });
    }
    // --- Node.js Environment (Basic Example) ---
    else if (typeof process !== 'undefined' && typeof process.on === 'function') {
      process.on('uncaughtException', (error: Error, origin: string) => {
        // It's critical to decide if the application should exit after an uncaughtException in Node.js.
        // Generally, the application state is unreliable. Logging and then exiting is common.
        this.handleError(error, `process.uncaughtException (origin: ${origin})`);
        // Consider exiting:
        // console.error("Uncaught exception detected. Application will now exit.");
        // process.exit(1);
      });

      process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        this.handleError(reason, 'process.unhandledRejection');
        // Similar to uncaughtException, decide on application fate.
      });
    }
  }

  /**
   * Call this method when the service is no longer needed to clean up subscriptions.
   */
  public dispose(): void {
    this._errorSubject$.complete();
    // Note: Removing global event listeners added in setupGlobalErrorHandlers
    // can be tricky if multiple instances of this service could exist or if
    // the application lifecycle is complex. For a singleton service, it might
    // not be strictly necessary if the app is shutting down.
    // If needed, store references to the handlers and use removeEventListener/process.removeListener.
  }
}
