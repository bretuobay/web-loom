import { describe, it, beforeEach, expect, afterEach } from 'vitest';

import { BaseViewModel } from './BaseViewModel';
import { BaseModel } from '../models/BaseModel';
import { z, ZodError } from 'zod';
import { first, skip, takeUntil } from 'rxjs/operators';
import { Observable } from 'rxjs';

// Define a test model and schema
const TestSchema = z.object({
  id: z.string(),
  name: z.string(),
});
type TestDataType = z.infer<typeof TestSchema>;

class MockBaseModel extends BaseModel<TestDataType, typeof TestSchema> {
  constructor(initialData: TestDataType | null = null) {
    super({
      initialData,
      schema: TestSchema,
    });
  }
}

describe('BaseViewModel', () => {
  let mockModel: MockBaseModel;
  let viewModel: BaseViewModel<MockBaseModel>;

  beforeEach(() => {
    mockModel = new MockBaseModel();
    viewModel = new BaseViewModel(mockModel);
  });

  afterEach(() => {
    viewModel.dispose(); // Ensure dispose is called after each test
  });

  it('should initialize with null data, not loading, and no error from model', async () => {
    expect(await viewModel.data$.pipe(first()).toPromise()).toBeNull();
    expect(await viewModel.isLoading$.pipe(first()).toPromise()).toBe(false);
    expect(await viewModel.error$.pipe(first()).toPromise()).toBeNull();
    expect(await viewModel.validationErrors$.pipe(first()).toPromise()).toBeNull();
  });

  it('should expose data$ from the model', async () => {
    const testData = { id: '1', name: 'Test' };
    mockModel.setData(testData);
    expect(await viewModel.data$.pipe(first()).toPromise()).toEqual(testData);
  });

  it('should expose isLoading$ from the model', async () => {
    mockModel.setLoading(true);
    expect(await viewModel.isLoading$.pipe(first()).toPromise()).toBe(true);

    mockModel.setLoading(false);
    expect(await viewModel.isLoading$.pipe(first()).toPromise()).toBe(false);
  });

  it('should expose error$ from the model', async () => {
    const testError = new Error('ViewModel error');
    mockModel.setError(testError);
    expect(await viewModel.error$.pipe(first()).toPromise()).toEqual(testError);

    mockModel.clearError();
    expect(await viewModel.error$.pipe(first()).toPromise()).toBeNull();
  });

  it('should derive validationErrors$ from model error$ if it is a ZodError', async () => {
    const nonZodError = new Error('Generic error');
    const zodError = new ZodError([]); // Create a simple ZodError instance

    // Initially null
    expect(await viewModel.validationErrors$.pipe(first()).toPromise()).toBeNull();

    // Set generic error, validationErrors$ should remain null
    mockModel.setError(nonZodError);
    expect(await viewModel.validationErrors$.pipe(first()).toPromise()).toBeNull();

    // Set ZodError, validationErrors$ should update
    mockModel.setError(zodError);
    expect(await viewModel.validationErrors$.pipe(skip(1), first()).toPromise()).toBe(zodError);

    // Clear error, validationErrors$ should become null again
    mockModel.clearError();
    expect(await viewModel.validationErrors$.pipe(first()).toPromise()).toBeNull();
  });

  it('should call dispose and unsubscribe from all subscriptions', async () => {
    const mockObservable = new Observable<string>((subscriber) => {
      subscriber.next('value1');
      subscriber.next('value2');
      setTimeout(() => subscriber.next('value3'), 100);
    });

    const emittedValues: string[] = [];
    const subscription = mockObservable
      .pipe(takeUntil(viewModel['_destroy$']))
      .subscribe((val) => emittedValues.push(val));

    // Add subscription to ViewModel for disposal
    viewModel['addSubscription'](subscription);

    expect(emittedValues).toEqual(['value1', 'value2']);

    viewModel.dispose();

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(emittedValues).toEqual(['value1', 'value2']);
    expect(subscription.closed).toBe(true);
  });

  it('should throw an error if model is not provided to constructor', () => {
    // @ts-ignore - Intentionally test invalid constructor argument
    expect(() => new BaseViewModel(null)).toThrow(
      'BaseViewModel requires an instance of BaseModel in its constructor.',
    );
  });
});
