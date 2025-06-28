import { RestfulTodoData, RestfulTodoSchema, RestfulTodoListSchema } from '../models/RestfulTodoSchema'; // Adjusted path

// Helper to generate unique IDs
const generateId = (): string => `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Helper for simulating network delay
const simulateNetworkDelay = (delayMs: number = 500) => new Promise((resolve) => setTimeout(resolve, delayMs));

interface FakeApiResponse {
  ok: boolean;
  status: number;
  headers: Headers;
  json: () => Promise<any>;
  text: () => Promise<string>;
}

export class FakeTodoApi {
  private todos: RestfulTodoData[] = [];
  public readonly baseUrl = 'http://fakeapi.example.com'; // Base URL doesn't really matter for the fake fetcher

  constructor(initialTodos: RestfulTodoData[] = []) {
    this.todos = initialTodos.map((todo) => ({
      ...todo,
      id: todo.id || generateId(),
      createdAt: todo.createdAt || new Date().toISOString(),
      updatedAt: todo.updatedAt || new Date().toISOString(),
    }));
  }

  public getFetcher() {
    return async (url: string, options?: RequestInit): Promise<FakeApiResponse> => {
      await simulateNetworkDelay();
      const method = options?.method?.toUpperCase() || 'GET';
      const requestBody = options?.body ? JSON.parse(options.body as string) : {};
      const urlParts = new URL(url); // Use URL to easily parse pathname and search params
      const endpointParts = urlParts.pathname.replace('/todos', '').split('/').filter(Boolean); // Assumes '/todos' is the base path

      let responseData: any = null;
      let status = 200;
      let ok = true;

      // GET /todos or /todos?ids=...
      if (method === 'GET' && endpointParts.length === 0) {
        const idsParam = urlParts.searchParams.get('ids');
        if (idsParam) {
          const ids = idsParam.split(',');
          responseData = this.todos.filter((todo) => ids.includes(todo.id));
        } else {
          responseData = [...this.todos];
        }
        // Validate response against schema - for internal consistency
        try {
          RestfulTodoListSchema.parse(responseData);
        } catch (e) {
          console.error('Fake API data error (GET list):', e);
          status = 500;
          ok = false;
          responseData = { error: 'Internal data validation failed' };
        }
      }
      // GET /todos/:id
      else if (method === 'GET' && endpointParts.length === 1) {
        const id = endpointParts[0];
        const todo = this.todos.find((t) => t.id === id);
        if (todo) {
          responseData = { ...todo };
          try {
            RestfulTodoSchema.parse(responseData);
          } catch (e) {
            console.error(`Fake API data error (GET single ${id}):`, e);
            status = 500;
            ok = false;
            responseData = { error: 'Internal data validation failed' };
          }
        } else {
          status = 404;
          ok = false;
          responseData = { error: 'Todo not found' };
        }
      }
      // POST /todos
      else if (method === 'POST' && endpointParts.length === 0) {
        try {
          // Validate input against a partial schema (text, isCompleted are required)
          const partialSchema = RestfulTodoSchema.pick({ text: true, isCompleted: true });
          const validatedInput = partialSchema.parse(requestBody);

          const newTodo: RestfulTodoData = {
            id: generateId(),
            ...validatedInput,
            text: validatedInput.text, // Ensure text is present
            isCompleted: validatedInput.isCompleted, // Ensure isCompleted is present
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.todos.push(newTodo);
          responseData = { ...newTodo };
        } catch (e: any) {
          status = 400;
          ok = false;
          responseData = { error: 'Invalid todo data', details: e.errors };
        }
      }
      // PUT /todos/:id
      else if (method === 'PUT' && endpointParts.length === 1) {
        const id = endpointParts[0];
        const index = this.todos.findIndex((t) => t.id === id);
        if (index !== -1) {
          try {
            // Validate payload - all fields of RestfulTodoData except id, createdAt, updatedAt
            const updatePayloadSchema = RestfulTodoSchema.omit({ id: true, createdAt: true, updatedAt: true });
            const validatedPayload = updatePayloadSchema.parse(requestBody);

            this.todos[index] = {
              ...this.todos[index],
              ...validatedPayload,
              updatedAt: new Date().toISOString(),
            };
            responseData = { ...this.todos[index] };
          } catch (e: any) {
            status = 400;
            ok = false;
            responseData = { error: 'Invalid update payload', details: e.errors };
          }
        } else {
          status = 404;
          ok = false;
          responseData = { error: 'Todo not found for update' };
        }
      }
      // DELETE /todos/:id
      else if (method === 'DELETE' && endpointParts.length === 1) {
        const id = endpointParts[0];
        const index = this.todos.findIndex((t) => t.id === id);
        if (index !== -1) {
          this.todos.splice(index, 1);
          status = 204; // No content
          responseData = null;
        } else {
          status = 404;
          ok = false;
          responseData = { error: 'Todo not found for deletion' };
        }
      }
      // Unhandled routes
      else {
        status = 404;
        ok = false;
        responseData = { error: `Not Found: ${method} ${urlParts.pathname}` };
      }

      const headers = new Headers();
      if (responseData !== null) {
        headers.set('Content-Type', 'application/json');
      }

      return {
        ok,
        status,
        headers,
        json: async () => responseData,
        text: async () => (responseData !== null ? JSON.stringify(responseData) : ''),
      };
    };
  }
}
