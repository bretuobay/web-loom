import type { TaskCreationPayload } from '../entities/task';

const DEFAULT_BASE_URL = 'http://localhost:4001';
const DEFAULT_DEMO_EMAIL = import.meta.env.VITE_TASKFLOW_API_DEMO_EMAIL ?? 'admin@taskflow.local';
const DEFAULT_DEMO_PASSWORD = import.meta.env.VITE_TASKFLOW_API_DEMO_PASSWORD ?? 'supersecure';

export interface ProjectResponse {
  id: string;
  name: string;
  description: string;
  color: string;
  status: string;
  tasks?: TaskResponse[];
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  assigneeId: string | null;
  assignee?: UserResponse;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

interface AuthResponse {
  token: string;
  user: unknown;
}

export class TaskFlowApiClient {
  private token: string | null = null;
  private pendingAuth: Promise<void> | null = null;

  constructor(private baseUrl = import.meta.env.VITE_TASKFLOW_API_BASE_URL ?? DEFAULT_BASE_URL) {}

  setAuthToken(token: string | null) {
    this.token = token;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    await this.ensureAuthToken();

    const headers = new Headers(options.headers ?? {});
    headers.set('Content-Type', 'application/json');
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers
    });
    if (!response.ok) {
      throw new Error(`TaskFlow API request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async fetchProjects() {
    return this.request<ProjectResponse[]>('/projects');
  }

  async fetchTasks() {
    return this.request<TaskResponse[]>('/tasks');
  }

  async fetchUsers() {
    return this.request<UserResponse[]>('/users');
  }

  async createTask(payload: TaskCreationPayload) {
    return this.request<TaskResponse>('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  private async ensureAuthToken() {
    if (this.token) {
      return;
    }

    if (!this.pendingAuth) {
      this.pendingAuth = this.authenticateDemoUser();
    }

    await this.pendingAuth;
  }

  private async authenticateDemoUser() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: DEFAULT_DEMO_EMAIL,
          password: DEFAULT_DEMO_PASSWORD
        })
      });

      if (!response.ok) {
        throw new Error(`Unable to authenticate to TaskFlow API: ${response.statusText}`);
      }

      const payload = (await response.json()) as AuthResponse;
      if (!payload.token) {
        throw new Error('TaskFlow API did not return an auth token');
      }

      this.token = payload.token;
    } finally {
      this.pendingAuth = null;
    }
  }
}
