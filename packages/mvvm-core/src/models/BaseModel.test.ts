import { describe, it, beforeEach, expect, vi } from 'vitest';
import { observe } from '@web-loom/signals-core';
import { BaseModel } from './BaseModel';
import { z } from 'zod';

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

  it('should initialize with null data, not loading, and no error', () => {
    expect(model.data$.get()).toBeNull();
    expect(model.isLoading$.get()).toBe(false);
    expect(model.error$.get()).toBeNull();
  });

  it('should set initial data correctly', () => {
    const initialData = { id: '1', name: 'Initial', age: 30 };
    const newModel = new BaseModel<TestDataType, typeof TestSchema>({
      initialData,
      schema: TestSchema,
    });
    expect(newModel.data$.get()).toEqual(initialData);
  });

  it('should update data using setData', () => {
    const newData = { id: '2', name: 'Updated', age: 25 };
    model.setData(newData);
    expect(model.data$.get()).toEqual(newData);
  });

  it('should update loading status using setLoading', () => {
    model.setLoading(true);
    expect(model.isLoading$.get()).toBe(true);

    model.setLoading(false);
    expect(model.isLoading$.get()).toBe(false);
  });

  it('should set and clear errors', () => {
    const testError = new Error('Something went wrong');
    model.setError(testError);
    expect(model.error$.get()).toEqual(testError);

    model.clearError();
    expect(model.error$.get()).toBeNull();
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

  it('should emit changes to data$ when setData is called multiple times', () => {
    const emittedData: (TestDataType | null)[] = [];
    // observe delivers the current value immediately, then every change —
    // mirroring BehaviorSubject subscription semantics.
    observe(model.data$, (data) => emittedData.push(data));

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
    it('should prevent further emissions after dispose', () => {
      const dataSpy = vi.fn();
      const isLoadingSpy = vi.fn();
      const errorSpy = vi.fn();

      model.data$.subscribe(dataSpy);
      model.isLoading$.subscribe(isLoadingSpy);
      model.error$.subscribe(errorSpy);

      // Call dispose
      model.dispose();

      // Attempt to emit new values — setters no-op after dispose
      model.setData({ id: '3', name: 'Disposed', age: 50 });
      model.setLoading(true);
      model.setError(new Error('Disposed error'));

      // Verify that no new values were emitted
      expect(dataSpy).not.toHaveBeenCalled();
      expect(isLoadingSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();

      // Current values remain readable and unchanged
      expect(model.data$.get()).toBeNull();
      expect(model.isLoading$.get()).toBe(false);
      expect(model.error$.get()).toBeNull();
    });
  });
});
