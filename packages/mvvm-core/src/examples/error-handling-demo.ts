import { SimpleDIContainer, ServiceRegistry } from '../core/di-container';
import { GlobalErrorService, HandledError } from '../services/global-error-service';
import { NotificationService } from '../services/notification-service'; // For showing errors as notifications
import { Subscription, throwError, timer, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

// Augment ServiceRegistry for this example
declare module '../core/di-container' {
  interface ServiceRegistry {
    globalErrorService: GlobalErrorService;
    notificationService: NotificationService; // Added for better demo
  }
}

// --- 1. Setup DI Container ---
function setupDI() {
  if (!SimpleDIContainer.isRegistered('globalErrorService')) {
    SimpleDIContainer.register('globalErrorService', GlobalErrorService, { isSingleton: true });
  }
  if (!SimpleDIContainer.isRegistered('notificationService')) {
    SimpleDIContainer.register('notificationService', NotificationService, { isSingleton: true });
  }
}

// --- 2. A Mock Service that might produce errors ---
class RiskyService {
  constructor(
    private errorService: GlobalErrorService,
    private notificationService: NotificationService
  ) {}

  doSomethingRisky(shouldSucceed: boolean): Observable<string> {
    console.log(`[RiskyService] Attempting risky operation (shouldSucceed: ${shouldSucceed})...`);
    return timer(500).pipe(
      map(() => {
        if (shouldSucceed) {
          const msg = 'Risky operation completed successfully!';
          this.notificationService.showSuccess(msg, 2000);
          return msg;
        } else {
          // Simulate an error that might occur within a service
          throw new Error('Something went wrong in RiskyService!');
        }
      }),
      catchError(err => {
        // Option 1: Handle error locally and report it
        console.error('[RiskyService] Caught error locally:', err.message);
        this.errorService.handleError(err, 'RiskyService.doSomethingRisky');
        // this.notificationService.showError(`RiskyService failed: ${err.message}`, 5000); // Also show user

        // Option 2: Re-throw to let caller or global handler manage
        return throwError(() => err);
      })
    );
  }

  // Simulates an operation that doesn't handle its own errors well
  doSomethingVeryRisky(): Observable<string> {
    return timer(300).pipe(
        map(() => {
            console.log("[RiskyService] About to perform VERY risky operation...");
            throw new Error("VERY Risky operation blew up!");
        })
    );
    // No local catchError, relying on caller or global handler
  }
}

// --- 3. Main Example Logic ---
export async function runErrorHandlingDemo() {
  console.log('--- Running Error Handling Demo ---');
  setupDI();

  const globalErrorService = SimpleDIContainer.resolve('globalErrorService');
  const notificationService = SimpleDIContainer.resolve('notificationService'); // For displaying errors
  const subscriptions: Subscription[] = [];

  // --- 4. Subscribe to Global Errors (Simulating a UI Error Display/Logger) ---
  console.log('Subscribing to global errors. Unhandled errors will be processed here:');
  subscriptions.push(
    globalErrorService.uncaughtErrors$.subscribe((handledError: HandledError) => {
      console.error(
        `\n💥 GLOBAL ERROR HANDLER CAUGHT 💥\n` +
        `  Error: ${handledError.error.message || handledError.error}\n` +
        `  Context: ${handledError.context || 'N/A'}\n` +
        `  Timestamp: ${handledError.timestamp.toISOString()}\n` +
        `  Processed Flag: ${handledError.processed}`
      );
      // In a real app, you might show a generic error message to the user here
      notificationService.showError(
        `Global Error: ${handledError.error.message || 'An unexpected error occurred.'} (Context: ${handledError.context || 'Unknown'})`,
        7000
      );
    })
  );

  const riskyService = new RiskyService(globalErrorService, notificationService);

  // --- 5. Scenario 1: Operation succeeds ---
  console.log('\nScenario 1: Risky operation that succeeds...');
  await firstValueFromSafe(riskyService.doSomethingRisky(true).pipe(
    catchError(err => {
      // This catchError is at the call site. RiskyService might also have its own.
      console.error('[CALL SITE] Error during successful risky op (should not happen):', err.message);
      // If RiskyService re-throws, it would be caught here.
      // globalErrorService.handleError(err, 'CallSite.RiskySuccess'); // Or report again
      return of(`Fallback after unexpected error: ${err.message}`);
    })
  ));
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for notifications

  // --- 6. Scenario 2: Operation fails, service handles and reports error ---
  console.log('\nScenario 2: Risky operation that fails (service handles/reports)...');
  await firstValueFromSafe(riskyService.doSomethingRisky(false).pipe(
      catchError(err => {
          console.error(`[CALL SITE] Error from failing risky op: ${err.message}. Service should have reported it.`);
          // The error was already reported by RiskyService. We might just provide a fallback UI value.
          return of(`Operation failed, but we recovered gracefully at call site. Error: ${err.message}`);
      })
  ));
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for notifications

  // --- 7. Scenario 3: Very risky operation, error caught by global handler via RxJS chain ---
  console.log('\nScenario 3: VERY Risky operation (error caught by global handler via RxJS chain)...');
  // No local .catchError here, error should propagate if not caught by global RxJS error handling
  // that might be set up elsewhere (e.g. in a command executor).
  // For this demo, we'll simulate a top-level subscription that uses the globalErrorService.
  const veryRiskySubscription = riskyService.doSomethingVeryRisky().subscribe({
      next: val => console.log("VERY Risky op succeeded (unexpected):", val),
      error: err => {
          console.error("[VERY RISKY SUB] Error caught by subscriber:", err.message);
          // Manually report to global error service from the subscriber
          globalErrorService.handleError(err, "VeryRiskySubscription.ErrorCallback");
      }
  });
  subscriptions.push(veryRiskySubscription);
  await new Promise(resolve => setTimeout(resolve, 1000));


  // --- 8. Scenario 4: Simulating an error from a Promise not handled by RxJS chain ---
  console.log('\nScenario 4: Simulating an unhandled Promise rejection (caught by window.onunhandledrejection)...');
  // This will be caught by the global `window.onunhandledrejection` if in a browser-like env.
  // or `process.on('unhandledRejection')` in Node.js.
  // These are setup by GlobalErrorService constructor.
  Promise.reject(new Error('Simulated unhandled promise rejection!'));
  // To make it truly unhandled by this async function's catch, we don't await it directly here
  // but let it run in the background.
  await new Promise(resolve => setTimeout(resolve, 500)); // Give time for rejection to be processed


  // --- 9. Scenario 5: Simulating a synchronous error (caught by window.onerror) ---
  console.log('\nScenario 5: Simulating a synchronous unhandled error (caught by window.onerror)...');
  // This will be caught by `window.onerror` or `process.uncaughtException`.
  // We need to run this in a way that bypasses typical try/catch of test runners or async functions.
  // A setTimeout can achieve this for window.onerror.
  setTimeout(() => {
    throw new Error('Simulated synchronous unhandled error!');
  }, 100);
  await new Promise(resolve => setTimeout(resolve, 500)); // Wait for it to throw and be handled


  // --- 10. Cleanup ---
  subscriptions.forEach(sub => sub.unsubscribe());
  // globalErrorService.dispose(); // If DI container is not managing singleton lifecycle fully

  console.log('--- Error Handling Demo Complete ---');
}

// Helper to convert Observable to Promise for await, with error catching
async function firstValueFromSafe<T>(obs: Observable<T>): Promise<T | undefined> {
  try {
    return await new Promise((resolve, reject) => {
        let sub: Subscription;
        sub = obs.subscribe({
            next: (val) => {
                resolve(val);
                if(sub) sub.unsubscribe();
            },
            error: (err) => {
                // Error is handled by catchError in the observable pipe or by global handler
                // We resolve with undefined or a specific error marker if needed by calling code
                resolve(undefined); // Or reject(err) if the top level await should fail
                if(sub) sub.unsubscribe();
            },
            complete: () => { // In case observable completes without a value after an error
                resolve(undefined);
                if(sub) sub.unsubscribe();
            }
        });
    });
  } catch (error) {
    // This catch is for if the Promise created by `new Promise` itself rejects,
    // which it does if `reject(err)` is called.
    console.error("[firstValueFromSafe] Error during promise conversion:", error);
    return undefined;
  }
}


// To run this example:
if (require.main === module) {
    runErrorHandlingDemo().catch(err => {
        // This top-level catch is for errors not handled by the demo's logic itself
        // or errors from the `runErrorHandlingDemo` async function structure.
        console.error("Unhandled error during example execution:", err);
        // In a real app, a global error service might already have caught this.
        const ges = SimpleDIContainer.isRegistered('globalErrorService') ? SimpleDIContainer.resolve('globalErrorService') : null;
        ges?.handleError(err, "runErrorHandlingDemo.TopLevelCatch");
    });
}
