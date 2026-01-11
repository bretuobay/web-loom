const DEFAULT_BASE_URL = 'http://localhost:4001';

export class TaskFlowApiClient {
  constructor(private baseUrl = import.meta.env.VITE_TASKFLOW_API_BASE_URL ?? DEFAULT_BASE_URL) {}

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`TaskFlow API request failed: ${response.statusText}`);
    }
    return response.json();
  }

  fetchProjects() {
    return this.request<ProjectResponse[]>('/projects');
  }

  fetchTasks() {
    return this.request<TaskResponse[]>('/tasks');
  }

  fetchUsers() {
    return this.request<UserResponse[]>('/users');
  }
}

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
