import { describe, it, expect, vi } from 'vitest';
import { z, ZodError } from 'zod';
import { take } from 'rxjs/operators';
import { BaseModel } from '../../models/BaseModel';
import { BaseViewModel } from '../../viewmodels/BaseViewModel';
import { createGenericViewModel, GenericViewModelFactoryConfig } from './viewModelFactory';

// 1. Simple NavigationItemSchema using Zod
const NavigationItemSchema = z.object({
  path: z.string(),
  label: z.string(),
});
type NavigationItem = z.infer<typeof NavigationItemSchema>;

// 2. ExampleModel class
// Define an input type for the ExampleModel constructor for clarity
interface ExampleModelConstructorInput<TData, TSchema extends z.ZodSchema<any>> {
  initialData: TData | null;
  schema?: TSchema;
  shouldValidateSchema?: boolean;
}

class ExampleModel<TData, TSchema extends z.ZodSchema<any>> extends BaseModel<TData, TSchema> {
  constructor(args: ExampleModelConstructorInput<TData, TSchema>) {
    super(args);
  }

  // Public method to expose a safeParse for testing, matching what the test expects
  public testValidate(data: TData): z.SafeParseReturnType<TData, TData> {
    // Access public readonly schema property from BaseModel
    if (!this.schema) {
      // This case should ideally not be hit if a schema is always provided for validation tests
      // console.error('testValidate: this.schema is undefined. Ensure it is passed correctly for tests requiring validation.'); // Removed
      return { success: true, data: data } as any; // Failsafe, but indicates a test setup issue
    }
    return this.schema.safeParse(data);
  }
}

// 3. ExampleViewModel class
class ExampleViewModel<M extends ExampleModel<any, any>> extends BaseViewModel<M> {
  constructor(model: M) {
    super(model);
  }
}

describe('createGenericViewModel', () => {
  // Common data for tests
  const navItemsData: NavigationItem[] = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
  ];

  const NavigationItemArraySchema = z.array(NavigationItemSchema);

  // Test Case 1: "should create a ViewModel instance with the correct Model and initial data"
  it('should create a ViewModel instance with the correct Model and initial data', () => {
    return new Promise<void>((done) => {
      const modelConstructorInput: ExampleModelConstructorInput<NavigationItem[], typeof NavigationItemArraySchema> = {
        initialData: navItemsData,
        schema: NavigationItemArraySchema,
        shouldValidateSchema: true,
      };

      const config: GenericViewModelFactoryConfig<
        ExampleModel<NavigationItem[], typeof NavigationItemArraySchema>,
        ExampleViewModel<ExampleModel<NavigationItem[], typeof NavigationItemArraySchema>>,
        [ExampleModelConstructorInput<NavigationItem[], typeof NavigationItemArraySchema>]
      > = {
        modelConstructor: ExampleModel,
        modelConstructorParams: [modelConstructorInput],
        viewModelConstructor: ExampleViewModel,
      };

      const viewModel = createGenericViewModel(config);

      expect(viewModel).toBeInstanceOf(ExampleViewModel);
      expect(viewModel.model).toBeInstanceOf(ExampleModel);

      viewModel.data$.subscribe((data) => {
        expect(data).toEqual(navItemsData);
        done();
      });
    });
  });

  // Test Case 2: "should reflect model data changes in the ViewModel"
  it('should reflect model data changes in the ViewModel', () => {
    return new Promise<void>((done) => {
      const modelConstructorInput: ExampleModelConstructorInput<NavigationItem[], typeof NavigationItemArraySchema> = {
        initialData: navItemsData,
        schema: NavigationItemArraySchema,
        shouldValidateSchema: true,
      };
      const config: GenericViewModelFactoryConfig<
        ExampleModel<NavigationItem[], typeof NavigationItemArraySchema>,
        ExampleViewModel<ExampleModel<NavigationItem[], typeof NavigationItemArraySchema>>,
        [ExampleModelConstructorInput<NavigationItem[], typeof NavigationItemArraySchema>]
      > = {
        modelConstructor: ExampleModel,
        modelConstructorParams: [modelConstructorInput],
        viewModelConstructor: ExampleViewModel,
      };
      const viewModel = createGenericViewModel(config);

      const updatedNavItemsData: NavigationItem[] = [{ path: '/contact', label: 'Contact' }];

      // Subscribe first to catch the change
      let callCount = 0;
      viewModel.data$.subscribe((data) => {
        callCount++;
        if (callCount === 1) {
          // Initial data
          expect(data).toEqual(navItemsData);
        } else if (callCount === 2) {
          // Updated data
          expect(data).toEqual(updatedNavItemsData);
          done();
        }
      });

      viewModel.model.setData(updatedNavItemsData);
    });
  });

  // Test Case 3: "should handle schema validation errors"
  it('should handle schema validation errors', () => {
    return new Promise<void>((done) => {
      const modelConstructorInputForErrorTest: ExampleModelConstructorInput<
        NavigationItem[] | null,
        typeof NavigationItemArraySchema
      > = {
        initialData: null, // initialData is null
        schema: NavigationItemArraySchema, // schema
        shouldValidateSchema: true, // shouldValidateSchema
      };

      const config: GenericViewModelFactoryConfig<
        ExampleModel<NavigationItem[] | null, typeof NavigationItemArraySchema>,
        ExampleViewModel<ExampleModel<NavigationItem[] | null, typeof NavigationItemArraySchema>>,
        [ExampleModelConstructorInput<NavigationItem[] | null, typeof NavigationItemArraySchema>]
      > = {
        modelConstructor: ExampleModel,
        modelConstructorParams: [modelConstructorInputForErrorTest],
        viewModelConstructor: ExampleViewModel,
      };

      const viewModel = createGenericViewModel(config);

      const invalidNavItemData: any[] = [{ path: 123, label: 'Invalid' }]; // Invalid data

      // Directly call the public testValidate method on the model instance
      const validationResult = viewModel.model.testValidate(invalidNavItemData as NavigationItem[]);
      if (!validationResult.success) {
        viewModel.model.setError(validationResult.error);
      } else {
        // Should not happen in this test case
        // If it does, let the test fail by not setting the error,
        // or explicitly fail: expect(validationResult.success).toBe(false);
        throw new Error('Validation unexpectedly passed for invalid data.');
      }

      let errorCallbackCalled = false;
      let validationErrorsCallbackCalled = false;

      const checkDone = () => {
        if (errorCallbackCalled && validationErrorsCallbackCalled) {
          // Ensure initial checks for null also passed if they are part of the logic.
          // However, the main goal here is to see the ZodError.
          done();
        }
      };

      viewModel.error$.subscribe((error) => {
        if (error) {
          // Ignore initial null emission
          expect(error).toBeInstanceOf(ZodError);
          const zodError = error as ZodError;
          expect(zodError.errors).toHaveLength(1);
          expect(zodError.errors[0].path).toEqual([0, 'path']);
          expect(zodError.errors[0].message).toBe('Expected string, received number');
          errorCallbackCalled = true;
          checkDone();
        }
      });

      viewModel.validationErrors$.subscribe((validationError) => {
        if (validationError) {
          // Ignore initial null emission
          expect(validationError).toBeInstanceOf(ZodError);
          const zodError = validationError as ZodError;
          expect(zodError.errors).toHaveLength(1);
          expect(zodError.errors[0].path).toEqual([0, 'path']);
          expect(zodError.errors[0].message).toBe('Expected string, received number');
          validationErrorsCallbackCalled = true;
          checkDone();
        }
      });

      // Check initial state: data should be null, error should be null
      // For data$
      viewModel.data$.pipe(take(1)).subscribe((initialData) => {
        expect(initialData).toBeNull(); // As per modelConstructorInputForErrorTest
      });
      // For error$ - check it's null before the setError call above takes effect
      viewModel.error$.pipe(take(1)).subscribe((initialError) => {
        // This will catch the initial null. If setError has already been called
        // and emitted a ZodError before this subscription happens (less likely for BehaviorSubject),
        // this check might be on the ZodError itself.
        // The primary check for ZodError is in the other subscriptions.
        if (!errorCallbackCalled) {
          // Check only if the main error check hasn't run
          expect(initialError).toBeNull();
        }
      });
    });
  });
});
