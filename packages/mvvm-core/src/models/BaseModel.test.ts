import { describe, it, beforeEach, expect, vi } from 'vitest';
import { BaseModel } from './BaseModel';
import { z } from 'zod';
import { first } from 'rxjs/operators';

describe('BaseModel', () => {
  // Define a simple Zod schema for testing
  const TestSchema = z.object({
    id: z.string(),
    name: z.string(),
    age: z.number().min(0),
  });

  type TestDataType = z.infer<typeof TestSchema>;

  let model: BaseModel<TestDataType, typeof TestSchema>;

  beforeEach(() => {
    model = new BaseModel<TestDataType, typeof TestSchema>({
      initialData: null,
      schema: TestSchema,
    });
  });

  it('should initialize with null data, not loading, and no error', async () => {
    expect(await model.data$.pipe(first()).toPromise()).toBeNull();
    expect(await model.isLoading$.pipe(first()).toPromise()).toBe(false);
    expect(await model.error$.pipe(first()).toPromise()).toBeNull();
  });

  it('should set initial data correctly', async () => {
    const initialData = { id: '1', name: 'Initial', age: 30 };
    const newModel = new BaseModel<TestDataType, typeof TestSchema>({
      initialData,
      schema: TestSchema,
    });
    expect(await newModel.data$.pipe(first()).toPromise()).toEqual(initialData);
  });

  it('should update data using setData', async () => {
    const newData = { id: '2', name: 'Updated', age: 25 };
    model.setData(newData);
    expect(await model.data$.pipe(first()).toPromise()).toEqual(newData);
  });

  it('should update loading status using setLoading', async () => {
    model.setLoading(true);
    expect(await model.isLoading$.pipe(first()).toPromise()).toBe(true);

    model.setLoading(false);
    expect(await model.isLoading$.pipe(first()).toPromise()).toBe(false);
  });

  it('should set and clear errors', async () => {
    const testError = new Error('Something went wrong');
    model.setError(testError);
    expect(await model.error$.pipe(first()).toPromise()).toEqual(testError);

    model.clearError();
    expect(await model.error$.pipe(first()).toPromise()).toBeNull();
  });

  it('should validate data successfully using the provided schema', () => {
    const validData = { id: 'abc', name: 'Test User', age: 42 };
    expect(model.validate(validData)).toEqual(validData);
  });

  it('should throw ZodError for invalid data when schema is provided', () => {
    const invalidData = { id: 'def', name: 'Another User', age: -5 }; // Invalid age
    expect(() => model.validate(invalidData)).toThrow(z.ZodError);
  });

  it('should not throw if no schema is provided', () => {
    const noSchemaModel = new BaseModel<any, any>({
      initialData: null,
      schema: undefined, // No schema provided
    });
    const data = { foo: 'bar' };
    expect(() => noSchemaModel.validate(data)).not.toThrow();
    expect(noSchemaModel.validate(data)).toEqual(data); // Returns data as is
  });

  it('should emit changes to data$ when setData is called multiple times', async () => {
    const emittedData: (TestDataType | null)[] = [];
    model.data$.subscribe((data) => emittedData.push(data));

    model.setData({ id: 'a', name: 'A', age: 1 });
    model.setData({ id: 'b', name: 'B', age: 2 });
    model.setData(null);

    // Expect initial null, then 'a', then 'b', then null again
    expect(emittedData).toEqual([
      null, // Initial state
      { id: 'a', name: 'A', age: 1 },
      { id: 'b', name: 'B', age: 2 },
      null,
    ]);
  });

  describe('dispose', () => {
    it('should complete all observables and prevent further emissions', () => {
      const dataNextSpy = vi.fn();
      const dataCompleteSpy = vi.fn();
      const isLoadingNextSpy = vi.fn();
      const isLoadingCompleteSpy = vi.fn();
      const errorNextSpy = vi.fn();
      const errorCompleteSpy = vi.fn();

      model.data$.subscribe({
        next: dataNextSpy,
        complete: dataCompleteSpy,
      });
      model.isLoading$.subscribe({
        next: isLoadingNextSpy,
        complete: isLoadingCompleteSpy,
      });
      model.error$.subscribe({
        next: errorNextSpy,
        complete: errorCompleteSpy,
      });

      // Call dispose
      model.dispose();

      // Verify that complete was called for all observables
      expect(dataCompleteSpy).toHaveBeenCalledTimes(1);
      expect(isLoadingCompleteSpy).toHaveBeenCalledTimes(1);
      expect(errorCompleteSpy).toHaveBeenCalledTimes(1);

      // Verify that initial values were received
      expect(dataNextSpy).toHaveBeenCalledWith(null); // Initial data
      expect(isLoadingNextSpy).toHaveBeenCalledWith(false); // Initial loading state
      expect(errorNextSpy).toHaveBeenCalledWith(null); // Initial error state

      // Reset spies to check if new values are emitted after dispose
      dataNextSpy.mockClear();
      isLoadingNextSpy.mockClear();
      errorNextSpy.mockClear();

      // Attempt to emit new values
      model.setData({ id: '3', name: 'Disposed', age: 50 });
      model.setLoading(true);
      model.setError(new Error('Disposed error'));

      // Verify that no new values were emitted
      expect(dataNextSpy).not.toHaveBeenCalled();
      expect(isLoadingNextSpy).not.toHaveBeenCalled();
      expect(errorNextSpy).not.toHaveBeenCalled();

      // Check the closed status of the underlying BehaviorSubjects
      // Note: Accessing private members like _data$ for testing is generally discouraged.
      // However, for verifying the internal state after dispose, it can be acceptable.
      // An alternative is to rely solely on the public observable behavior.
    });
  });
});
