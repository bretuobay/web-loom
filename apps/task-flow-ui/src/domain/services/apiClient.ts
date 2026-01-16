import type { ProjectCreationPayload } from '../entities/project';
import type { TaskCreationPayload } from '../entities/task';
import type { ProfilePreferences, UserApiResponse } from '../entities/user';

const DEFAULT_BASE_URL = 'http://localhost:4001';

export interface AuthResponse {
  token: string;
  user: UserApiResponse;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthPayload {
  displayName: string;
  role?: string;
  avatarUrl?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
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

export interface AttachmentResponse {
  id: string;
  taskId: string;
  originalName: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse extends UserApiResponse {}

export interface ProfileUpdatePayload {
  displayName?: string;
  avatarUrl?: string | null;
  preferences?: ProfilePreferences | null;
}

export interface CommentResponse {
  id: string;
  content: string;
  taskId: string;
  author: UserResponse;
  createdAt: string;
  updatedAt: string;
}

export class TaskFlowApiClient {
  private token: string | null = null;
  private baseUrl: string;

  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers ?? {});
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `${response.status} ${response.statusText}`;
      try {
        const body = await response.json();
        if (body?.message) {
          errorMessage = body.message;
        }
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(`TaskFlow API request failed: ${errorMessage}`);
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json();
  }

  async login(payload: AuthPayload) {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async register(payload: RegisterPayload) {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async changePassword(payload: ChangePasswordPayload) {
    return this.request<void>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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
      body: JSON.stringify(payload),
    });
  }

  async updateTask(taskId: string, payload: Partial<TaskCreationPayload>) {
    return this.request<TaskResponse>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteTask(taskId: string) {
    return this.request<void>(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  async updateProject(projectId: string, payload: Partial<ProjectResponse>) {
    return this.request<ProjectResponse>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async createProject(payload: ProjectCreationPayload) {
    return this.request<ProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteProject(projectId: string) {
    return this.request<void>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  async uploadTaskAttachment(taskId: string, file: File) {
    return this.request<AttachmentResponse>(`/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'x-file-name': encodeURIComponent(file.name)
      },
      body: file
    });
  }

  async fetchComments(taskId: string) {
    return this.request<CommentResponse[]>(`/comments/task/${taskId}`);
  }

  async createComment(payload: { taskId: string; content: string }) {
    return this.request<CommentResponse>('/comments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async fetchProfile() {
    return this.request<UserApiResponse>('/profile');
  }

  async updateProfile(payload: ProfileUpdatePayload) {
    return this.request<UserApiResponse>('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }
}

export const taskFlowApiClient = new TaskFlowApiClient();
