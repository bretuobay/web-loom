import { createStorage, type Storage } from '@web-loom/storage-core';
import { TaskEntity, type TaskApiResponse, type TaskCreationPayload } from '../entities/task';
import { ApiTaskRepository } from './ApiTaskRepository';
import type { ITaskRepository } from './interfaces';

const CACHE_KEY = 'tasks';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let storagePromise: Promise<Storage> | null = null;

function getStorage(): Promise<Storage> {
  if (!storagePromise) {
    storagePromise = createStorage({
      backend: ['indexeddb', 'localstorage', 'memory'],
      name: 'taskflow-cache',
      namespace: 'repositories',
      defaultTTL: CACHE_TTL
    });
  }
  return storagePromise;
}

interface CachedData {
  data: TaskApiResponse[];
  timestamp: number;
}

export class CachingTaskRepository implements ITaskRepository {
  private apiRepo: ApiTaskRepository;

  constructor(apiRepo?: ApiTaskRepository) {
    this.apiRepo = apiRepo ?? new ApiTaskRepository();
  }

  async fetchAll(): Promise<TaskEntity[]> {
    const storage = await getStorage();

    try {
      // Try to fetch fresh data
      const tasks = await this.apiRepo.fetchAll();

      // Cache the result (serialize to plain objects)
      const cacheData: CachedData = {
        data: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          assignee: t.assignee
            ? { id: t.assignee.id, displayName: t.assignee.displayName, email: t.assignee.email, avatarUrl: t.assignee.avatarUrl, role: t.assignee.role }
            : undefined,
          assigneeId: t.assigneeId,
          dueDate: t.dueDate?.toISOString() ?? null,
          projectId: t.projectId,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString()
        })),
        timestamp: Date.now()
      };
      await storage.set(CACHE_KEY, cacheData);

      return tasks;
    } catch (error) {
      // Fallback to cache
      const cached = await storage.get<CachedData>(CACHE_KEY);
      if (cached) {
        console.warn('Using cached tasks data (offline mode)');
        return cached.data.map((data) => TaskEntity.fromApi(data));
      }
      throw error;
    }
  }

  async getById(id: string): Promise<TaskEntity | null> {
    const tasks = await this.fetchAll();
    return tasks.find((t) => t.id === id) ?? null;
  }

  async create(payload: TaskCreationPayload): Promise<TaskEntity> {
    // Creation requires online - no offline queue per requirements
    return this.apiRepo.create(payload);
  }
}
