/// <reference types="vitest/globals" />
import { firstValueFrom } from 'rxjs';
import { ZodError } from 'zod';
import { RestfulTodoListModel } from './RestfulTodoModel';
import { RestfulTodoData, RestfulTodoListSchema } from './RestfulTodoSchema';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'; // Using vitest/jest like syntax

// Mock fetcher function
const mockFetcher = vi.fn();

describe('RestfulTodoListModel', () => {
  let model: RestfulTodoListModel;
  const baseUrl = 'http://test.api';
  const endpoint = '/todos';
  const initialTodo: RestfulTodoData = {
    id: '1',
    text: 'Test Todo 1',
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const initialTodoList: RestfulTodoData[] = [initialTodo];

  beforeEach(() => {
    mockFetcher.mockReset();
    model = new RestfulTodoListModel({
      baseUrl,
      endpoint,
      fetcher: mockFetcher,
      schema: RestfulTodoListSchema,
      initialData: null,
    });
  });

  afterEach(() => {
    model.dispose();
  });

  it('should initialize correctly', async () => {
    expect(await firstValueFrom(model.data$)).toBeNull();
    expect(await firstValueFrom(model.isLoading$)).toBe(false); // isLoading$ is also an observable
    expect(await firstValueFrom(model.error$)).toBeNull(); // error$ is also an observable
  });

  describe('fetch', () => {
    it('should fetch and set data successfully', async () => {
      mockFetcher.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => [...initialTodoList],
        text: async () => JSON.stringify(initialTodoList),
      });

      await model.fetch();
      expect(mockFetcher).toHaveBeenCalledWith(`${baseUrl}${endpoint}`, expect.objectContaining({ method: 'GET' }));
      expect(await firstValueFrom(model.data$)).toEqual(initialTodoList);
      expect(await firstValueFrom(model.isLoading$)).toBe(false);
      expect(await firstValueFrom(model.error$)).toBeNull();
    });

    it('should handle fetch error', async () => {
      const error = new Error('Fetch failed');
      mockFetcher.mockRejectedValueOnce(error);
      await model.fetch(); // fetch itself is async
      expect(await firstValueFrom(model.error$)).toBe(error);
      expect(await firstValueFrom(model.isLoading$)).toBe(false);
      expect(await firstValueFrom(model.data$)).toBeNull();
    });
    it('should handle fetch error with non-ok response', async () => {
      mockFetcher.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Server Error' }),
        text: async () => '{ "message": "Server Error" }',
      });
      try {
        await model.fetch();
      } catch (e) {
        // Error is expected
      }
      const error = await firstValueFrom(model.error$);
      expect(error).toBeInstanceOf(ZodError);
      expect(await firstValueFrom(model.isLoading$)).toBe(false);
    });
  });

  describe('create', () => {
    const newTodoPayload = { text: 'New Todo', isCompleted: false };
    const newTodoResponse: RestfulTodoData = {
      ...newTodoPayload,
      id: '2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should optimistically create and then confirm', async () => {
      model.setData([]); // Start with an empty list for this test
      mockFetcher.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => newTodoResponse,
        text: async () => JSON.stringify(newTodoResponse),
      });

      const createPromise = model.create(newTodoPayload as any);

      // Check optimistic update (temporary ID might be present)
      const optimisticData = await firstValueFrom(model.data$);
      expect(optimisticData).toHaveLength(1);
      expect(optimisticData![0].text).toBe(newTodoPayload.text);
      expect(optimisticData![0].id).toMatch(/^temp_/); // Check for temp ID

      await createPromise;

      expect(mockFetcher).toHaveBeenCalledWith(
        `${baseUrl}${endpoint}`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newTodoPayload),
        }),
      );
      expect(await firstValueFrom(model.data$)).toEqual([newTodoResponse]); // Replaced with server response
      expect(await firstValueFrom(model.isLoading$)).toBe(false);
    });

    it('should revert optimistic create on server error', async () => {
      model.setData([]);
      const error = new Error('Create failed');
      mockFetcher.mockRejectedValueOnce(error);

      try {
        await model.create(newTodoPayload as any);
      } catch (e) {
        expect(e).toBe(error);
      }
      expect(await firstValueFrom(model.data$)).toEqual([]); // Reverted
      expect(await firstValueFrom(model.error$)).toBe(error);
      expect(await firstValueFrom(model.isLoading$)).toBe(false);
    });
  });

  describe('update', () => {
    const updatePayload = { text: 'Updated Text' };
    const updatedTodoResponse: RestfulTodoData = {
      ...initialTodo,
      ...updatePayload,
      updatedAt: new Date().toISOString(),
    };

    it('should optimistically update and then confirm', async () => {
      model.setData([...initialTodoList]);
      mockFetcher.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => updatedTodoResponse,
        text: async () => JSON.stringify(updatedTodoResponse),
      });

      const updatePromise = model.update(initialTodo.id, updatePayload as any);

      // Check optimistic update
      expect((await firstValueFrom(model.data$))![0].text).toBe(updatePayload.text);

      await updatePromise;

      expect(mockFetcher).toHaveBeenCalledWith(
        `${baseUrl}${endpoint}/${initialTodo.id}`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updatePayload),
        }),
      );
      expect((await firstValueFrom(model.data$))![0]).toEqual(updatedTodoResponse);
      expect(await firstValueFrom(model.isLoading$)).toBe(false);
    });

    it('should revert optimistic update on server error', async () => {
      model.setData([...initialTodoList]);
      const error = new Error('Update failed');
      mockFetcher.mockRejectedValueOnce(error);

      try {
        await model.update(initialTodo.id, updatePayload as any);
      } catch (e) {
        expect(e).toBe(error);
      }
      expect(await firstValueFrom(model.data$)).toEqual(initialTodoList); // Reverted
      expect(await firstValueFrom(model.error$)).toBe(error);
      expect(await firstValueFrom(model.isLoading$)).toBe(false);
    });
  });

  describe('delete', () => {
    it('should optimistically delete and then confirm', async () => {
      model.setData([...initialTodoList]);
      mockFetcher.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(), // No content for delete
        json: async () => null,
        text: async () => '',
      });

      const deletePromise = model.delete(initialTodo.id);

      // Check optimistic update
      expect(await firstValueFrom(model.data$)).toEqual([]);

      await deletePromise;
      expect(mockFetcher).toHaveBeenCalledWith(
        `${baseUrl}${endpoint}/${initialTodo.id}`,
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(await firstValueFrom(model.data$)).toEqual([]);
      expect(await firstValueFrom(model.isLoading$)).toBe(false);
    });

    it('should revert optimistic delete on server error', async () => {
      model.setData([...initialTodoList]);
      const error = new Error('Delete failed');
      mockFetcher.mockRejectedValueOnce(error);

      try {
        await model.delete(initialTodo.id);
      } catch (e) {
        expect(e).toBe(error);
      }
      expect(await firstValueFrom(model.data$)).toEqual(initialTodoList); // Reverted
      expect(await firstValueFrom(model.error$)).toBe(error);
      expect(await firstValueFrom(model.isLoading$)).toBe(false);
    });
  });
});
