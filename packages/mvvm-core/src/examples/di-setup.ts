import { SimpleDIContainer, ServiceRegistry, Constructor, Factory } from '../core/di-container';
import { NotificationService } from '../services/notification-service';
import { GlobalErrorService } from '../services/global-error-service';
import { FormViewModel } from '../viewmodels/form-view-model';
import { QueryableCollectionViewModel } from '../viewmodels/queryable-collection-view-model';
import { z } from 'zod';
import { Observable, of } from 'rxjs';

// --- 1. Define Application Services and Interfaces (if any) ---

// Example: Configuration Service
interface AppConfig {
  apiUrl: string;
  featureFlags: {
    newDashboard: boolean;
    enableLogging: boolean;
  };
}

// Example: A more complex service that depends on other services
class DataFetcherService {
  constructor(
    private config: AppConfig,
    private errorService: GlobalErrorService,
    private notificationService: NotificationService
  ) {
    this.notificationService.showInfo('DataFetcherService initialized.', 1000);
  }

  fetchData(endpoint: string): Observable<any> {
    this.notificationService.showInfo(`Fetching data from ${this.config.apiUrl}/${endpoint}`, 2000);
    if (!this.config.featureFlags.enableLogging) {
        console.warn("Logging is disabled in DataFetcherService via feature flag.");
    }
    // Simulate API call
    if (endpoint === 'fail') {
      const error = new Error('Simulated API fetch error');
      this.errorService.handleError(error, `DataFetcherService.fetchData(${endpoint})`);
      return of({ error: 'Failed to fetch' }); // Or throw
    }
    return of({ data: `Data from ${endpoint}`, timestamp: Date.now() });
  }
}

// Example: Product type for QueryableCollectionViewModel
interface Product {
  id: number;
  name: string;
  price: number;
}

// Example: User type and schema for FormViewModel
const UserProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});
type UserProfile = z.infer<typeof UserProfileSchema>;


// --- 2. Augment ServiceRegistry with all application services ---
declare module '../core/di-container' {
  interface ServiceRegistry {
    // Core Services
    notificationService: NotificationService;
    globalErrorService: GlobalErrorService;

    // Application Specific Services
    appConfig: AppConfig; // Singleton configuration object
    dataFetcher: DataFetcherService;

    // ViewModels (often transient, unless representing shared state)
    userProfileForm: FormViewModel<UserProfile, typeof UserProfileSchema, UserProfile>;
    productListVM: QueryableCollectionViewModel<Product>;

    // Potentially a factory for a specific configuration
    featureFlag_newDashboard: boolean;
  }
}

// --- 3. Create an Application Initializer/Setup Function ---
export function initializeApplicationServices() {
  console.log('--- Initializing Application Services via DI Container ---');

  // Register Core Services
  SimpleDIContainer.register('notificationService', NotificationService, { isSingleton: true });
  SimpleDIContainer.register('globalErrorService', GlobalErrorService, { isSingleton: true });

  // Register Application Configuration (as a singleton object via factory)
  const appConfigFactory: Factory<AppConfig> = () => ({
    apiUrl: 'https://api.example.com/v1',
    featureFlags: {
      newDashboard: true,
      enableLogging: true,
    },
  });
  SimpleDIContainer.register('appConfig', appConfigFactory, { isSingleton: true });

  // Register a specific feature flag using a factory and dependency
  const newDashboardFlagFactory: Factory<boolean> = (config: AppConfig) => config.featureFlags.newDashboard;
  SimpleDIContainer.register('featureFlag_newDashboard', newDashboardFlagFactory, {
    dependencies: ['appConfig'],
    isSingleton: true // Flags derived from config are effectively singletons if config is
  });


  // Register Application Specific Services
  SimpleDIContainer.register('dataFetcher', DataFetcherService, {
    dependencies: ['appConfig', 'globalErrorService', 'notificationService'],
    isSingleton: true, // DataFetcher might be a singleton
  });

  // Register ViewModel Factories (often ViewModels are transient or scoped to a component)
  // Factory for UserProfileForm
  const userProfileFormFactory: Factory<FormViewModel<UserProfile, typeof UserProfileSchema, UserProfile>> = (
    notificationService: NotificationService, // Example: Form may use notifications
    globalErrorService: GlobalErrorService
  ) => {
    return new FormViewModel<UserProfile, typeof UserProfileSchema, UserProfile>(
      { name: '', email: '' }, // Initial data
      UserProfileSchema,
      async (data) => { // Submit handler
        notificationService.showInfo('Submitting profile...', 2000);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (data.email.includes('fail')) {
            const err = new Error("Simulated profile submission error for email containing 'fail'");
            globalErrorService.handleError(err, 'UserProfileForm.Submit');
            throw err;
        }
        notificationService.showSuccess('Profile submitted successfully!', 3000);
        return { ...data }; // Return submitted data
      }
    );
  };
  SimpleDIContainer.register('userProfileForm', userProfileFormFactory, {
    dependencies: ['notificationService', 'globalErrorService'],
    isSingleton: false, // New form instance each time it's resolved
  });

  // Factory for ProductListVM
  const productListVMFactory: Factory<QueryableCollectionViewModel<Product>> = () => {
    const sampleProducts: Product[] = [
      { id: 1, name: 'Super Laptop', price: 1200 },
      { id: 2, name: 'Wireless Keyboard', price: 75 },
      { id: 3, name: 'HD Monitor', price: 300 },
    ];
    return new QueryableCollectionViewModel<Product>(sampleProducts, 10); // Page size 10
  };
  SimpleDIContainer.register('productListVM', productListVMFactory, {
    isSingleton: true, // Assuming one shared product list for the app view
  });

  console.log('--- Application Services Initialized ---');
}

// --- 4. Example Usage ---
export function demonstrateDISetup() {
  console.log('\n--- Demonstrating DI Setup Usage ---');

  // Ensure services are initialized (in a real app, this happens once at startup)
  if (!SimpleDIContainer.isRegistered('appConfig')) { // Check if already initialized
    initializeApplicationServices();
  }

  // Resolve services
  const config = SimpleDIContainer.resolve('appConfig');
  console.log('Resolved App API URL:', config.apiUrl);
  console.log('New Dashboard Feature Flag:', SimpleDIContainer.resolve('featureFlag_newDashboard'));


  const dataFetcher = SimpleDIContainer.resolve('dataFetcher');
  dataFetcher.fetchData('users').subscribe(response => console.log('DataFetcher Response (users):', response));
  dataFetcher.fetchData('fail').subscribe(response => console.log('DataFetcher Response (fail):', response));


  // Resolve a transient ViewModel instance
  const form1 = SimpleDIContainer.resolve('userProfileForm');
  form1.updateField('name', 'Alice');
  console.log('Form 1 Name:', form1.formData$.getValue().name);

  const form2 = SimpleDIContainer.resolve('userProfileForm'); // Should be a new instance
  console.log('Form 2 Name (should be initial):', form2.formData$.getValue().name);
  form2.updateField('name', 'Bob');

  if (form1 === form2) {
    console.error("DI ERROR: userProfileForm should be transient but got same instance!");
  } else {
    console.log("DI SUCCESS: userProfileForm instances are different (transient).");
  }


  // Resolve a singleton ViewModel instance
  const productList1 = SimpleDIContainer.resolve('productListVM');
  productList1.setFilter('Laptop');
  console.log('ProductList1 Page 1 (Filtered):', productList1.paginatedItems$.getValue().map(p=>p.name));

  const productList2 = SimpleDIContainer.resolve('productListVM'); // Should be the same instance
  console.log('ProductList2 Page 1 (Should also be Filtered):', productList2.paginatedItems$.getValue().map(p=>p.name));

  if (productList1 !== productList2) {
    console.error("DI ERROR: productListVM should be singleton but got different instances!");
  } else {
    console.log("DI SUCCESS: productListVM instances are the same (singleton).");
  }

  // Clean up by resetting the container if you were to run this multiple times in a test suite, for example.
  // SimpleDIContainer.reset();
  console.log('--- DI Setup Demonstration Complete ---');
}

// To run this example:
if (require.main === module) {
    demonstrateDISetup();
    // Note: initializeApplicationServices() is called by demonstrateDISetup() if needed.
}
