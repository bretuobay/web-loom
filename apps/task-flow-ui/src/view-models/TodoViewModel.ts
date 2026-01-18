import { z } from 'zod';
import { createReactiveViewModel, type ViewModelFactoryConfig } from '@web-loom/mvvm-core';
import { nativeFetcher } from '@repo/models';

const TODO_API_BASE_URL = 'http://localhost:8001';
const TODO_ENDPOINT = '/todos';
const TASKFLOW_TOKEN_STORAGE_KEY = 'taskflow_token';

const TodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  details: z.string().optional(),
  completed: z.boolean(),
  dueDate: z.string(),
  userId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TodoListItem = z.infer<typeof TodoSchema>;
export const TodoListSchema = z.array(TodoSchema);
export type TodoListData = z.infer<typeof TodoListSchema>;

type HeadersLike = HeadersInit | undefined;

const normalizeHeaders = (input?: HeadersLike): Record<string, string> => {
  if (!input) {
    return {};
  }

  if (input instanceof Headers) {
    const result: Record<string, string> = {};
    input.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  if (Array.isArray(input)) {
    return input.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }

  return { ...input };
};

const readAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(TASKFLOW_TOKEN_STORAGE_KEY);
};

const taskFlowAuthFetcher = (url: string, options: RequestInit = {}, timeoutMs = 30000) => {
  const headers = normalizeHeaders(options.headers);
  const token = readAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return nativeFetcher(url, { ...options, headers }, timeoutMs);
};

const todoConfig = {
  baseUrl: TODO_API_BASE_URL,
  endpoint: TODO_ENDPOINT,
  fetcher: taskFlowAuthFetcher,
  schema: TodoListSchema,
  initialData: [] as TodoListData,
  validateSchema: false,
} as const;

type TodoViewModelConfig = ViewModelFactoryConfig<TodoListData, typeof TodoListSchema>;

const config: TodoViewModelConfig = {
  modelConfig: todoConfig,
  schema: TodoListSchema,
};

export const todoViewModel = createReactiveViewModel(config);
