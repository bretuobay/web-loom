import { z } from 'zod';
import { FormViewModel } from '../viewmodels/form-view-model';
import { SimpleDIContainer, ServiceRegistry } from '../core/di-container';
import { NotificationService } from '../services/notification-service';
import { GlobalErrorService } from '../services/global-error-service';
import { of, throwError, timer } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';

// Augment ServiceRegistry for this example
declare module '../core/di-container' {
  interface ServiceRegistry {
    notificationService: NotificationService;
    globalErrorService: GlobalErrorService;
    userFormViewModel: UserFormViewModel; // Example-specific ViewModel
  }
}

// --- 1. Define User Data Structure and Schema ---
const UserSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username too long'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'You must be 18 or older to register').optional(),
  bio: z.string().max(200, 'Bio is too long').optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
});
type UserData = z.infer<typeof UserSchema>;

// --- 2. Define a custom FormViewModel for User (Optional, but good practice) ---
//    You can directly use FormViewModel, but a derived class can encapsulate submission logic.
class UserFormViewModel extends FormViewModel<UserData, typeof UserSchema, UserData> {
  constructor(
    initialData: Partial<UserData>,
    // In a real app, this would likely come from DI too
    private notificationService: NotificationService,
    private errorService: GlobalErrorService
  ) {
    super(initialData, UserSchema, (data) => this.submitUserData(data));
  }

  private submitUserData(data: UserData): Observable<UserData> {
    this.notificationService.showInfo('Submitting user data...', 2000);
    console.log('[UserFormViewModel] Submitting data:', data);

    // Simulate an API call
    return timer(1500).pipe(
      map(() => {
        if (data.username === 'errorUser') {
          this.notificationService.showError('Simulated server error for user: errorUser', 5000);
          throw new Error('Simulated server validation failed for username "errorUser"');
        }
        if (data.username === 'networkError') {
            this.notificationService.showError('Simulated network error.', 5000);
            return throwError(() => new Error("Simulated Network Error"));
        }

        const resultData: UserData = { ...data, id: data.id || `user-${Date.now()}` };
        this.notificationService.showSuccess('User data submitted successfully!', 3000);
        console.log('[UserFormViewModel] Submission successful:', resultData);
        return resultData;
      }),
      catchError(err => {
        console.error('[UserFormViewModel] Submission error:', err);
        // Use global error service for unexpected errors
        this.errorService.handleError(err, 'UserFormViewModel.submitUserData');
        // Propagate the error so the command's error handler can also react
        return throwError(() => err);
      })
    );
  }
}

// --- 3. Setup DI Container (Typically done at application root) ---
function setupDI() {
  if (!SimpleDIContainer.isRegistered('notificationService')) {
    SimpleDIContainer.register('notificationService', NotificationService, { isSingleton: true });
  }
  if (!SimpleDIContainer.isRegistered('globalErrorService')) {
    SimpleDIContainer.register('globalErrorService', GlobalErrorService, { isSingleton: true });
  }

  // Register the UserFormViewModel using a factory to inject dependencies
  SimpleDIContainer.register('userFormViewModel',
    (notificationService: NotificationService, globalErrorService: GlobalErrorService) => {
      const initialFormData: Partial<UserData> = {
        username: '',
        email: '',
        agreeToTerms: false,
      };
      return new UserFormViewModel(initialFormData, notificationService, globalErrorService);
    },
    {
      dependencies: ['notificationService', 'globalErrorService'],
      isSingleton: false // Typically forms are transient, one per instance of a form UI
    }
  );
}

// --- 4. Main Example Logic ---
export async function runUserFormExample() {
  console.log('--- Running User Form Example ---');

  setupDI();

  const notificationService = SimpleDIContainer.resolve('notificationService');
  const globalErrorService = SimpleDIContainer.resolve('globalErrorService'); // To see its output

  // Resolve the form view model
  const userForm = SimpleDIContainer.resolve('userFormViewModel');

  // --- 5. Subscribe to Form Observables (Simulating UI Binding) ---
  console.log('Initial Form Data:', userForm.formData$.getValue());

  userForm.formData$.subscribe(data => {
    // In a real UI, you'd update input field values here
    // console.log('Form Data Changed:', data);
  });

  userForm.isValid$.subscribe(isValid => {
    console.log('Is Form Valid?:', isValid);
    // In a real UI, you might enable/disable a submit button
  });

  userForm.isDirty$.subscribe(isDirty => {
    console.log('Is Form Dirty?:', isDirty);
  });

  userForm.fieldErrors$.subscribe(errors => {
    // In a real UI, you'd display these errors next to respective fields
    if (Object.keys(errors).length > 0) {
      console.warn('Field Errors:', errors);
    }
  });

  userForm.submitCommand.canExecute$.subscribe(canExecute => {
    console.log('Can Submit?:', canExecute);
  });

  // --- 6. Simulate User Input ---
  console.log('\nSimulating user input...');
  userForm.updateField('username', 'Jo'); // Invalid (too short)
  await new Promise(resolve => setTimeout(resolve, 100)); // Allow validation to run

  userForm.updateField('username', 'JohnDoe');
  await new Promise(resolve => setTimeout(resolve, 100));

  userForm.updateField('email', 'johndoe@example'); // Invalid email
  await new Promise(resolve => setTimeout(resolve, 100));

  userForm.updateField('email', 'johndoe@example.com');
  await new Promise(resolve => setTimeout(resolve, 100));

  userForm.updateField('age', 25);
  await new Promise(resolve => setTimeout(resolve, 100));

  // userForm.updateField('agreeToTerms', false); // Will cause validation error
  // await new Promise(resolve => setTimeout(resolve, 100));

  userForm.updateField('agreeToTerms', true);
  await new Promise(resolve => setTimeout(resolve, 100));


  // --- 7. Simulate Form Submission ---
  console.log('\nAttempting form submission...');
  if (userForm.submitCommand.canExecute$.getValue()) {
    userForm.submitCommand.execute().subscribe({
      next: (result) => {
        console.log('Submission Succeeded (View/Component Level):', result);
        // userForm.resetForm(); // Optionally reset after successful submission
      },
      error: (err) => {
        console.error('Submission Failed (View/Component Level):', err.message);
        // Error is already handled by form's submit logic and global error handler
      }
    });
  } else {
    console.error('Cannot submit form, it is not valid or cannot execute.');
  }

  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for submission to complete

  // --- 8. Simulate another submission that fails server-side ---
  console.log('\nSimulating submission that causes server error...');
  userForm.resetForm(); // Reset for new entry
  userForm.updateField('username', 'errorUser');
  userForm.updateField('email', 'error@example.com');
  userForm.updateField('agreeToTerms', true);
  await new Promise(resolve => setTimeout(resolve, 100));

  if (userForm.submitCommand.canExecute$.getValue()) {
    userForm.submitCommand.execute().subscribe({
      next: (result) => console.log('Submission Succeeded (should not happen for errorUser):', result),
      error: (err) => console.error('Submission Failed for errorUser (View/Component Level):', err.message)
    });
  }
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait

  // --- 9. Demonstrate Reset ---
  console.log('\nDemonstrating form reset...');
  userForm.updateField('username', 'DirtyUser');
  console.log('Form data before reset:', userForm.formData$.getValue());
  console.log('Is dirty before reset:', userForm.isDirty$.getValue());
  userForm.resetForm();
  console.log('Form data after reset:', userForm.formData$.getValue());
  console.log('Is dirty after reset:', userForm.isDirty$.getValue());
  console.log('Field errors after reset:', userForm.fieldErrors$.getValue());


  // --- Cleanup (important if objects have subscriptions that need to be manually managed)
  // userForm.dispose(); // If FormViewModel has subscriptions it manages internally that need explicit cleanup
  // For this example, UserFormViewModel itself doesn't have long-lived internal subs beyond its subjects,
  // and SimpleDIContainer doesn't manage lifecycle beyond creation.
  // For a real app, a more robust lifecycle management for ViewModels might be needed.

  console.log('--- User Form Example Complete ---');
}

// To run this example (e.g., in a Node.js environment or a test runner):
// runUserFormExample().catch(err => console.error("Example run failed:", err));
// If you are in a browser environment, you might call this from a script tag
// or integrate it into a UI framework's lifecycle.

// Example of how to run it if this file is executed directly with ts-node:
if (require.main === module) {
    runUserFormExample().catch(err => {
        console.error("Unhandled error in example execution:", err);
    });
}
