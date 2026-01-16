import { createStorage, type Storage } from '@web-loom/storage-core';
import { ProjectEntity, type ProjectApiResponse, type ProjectCreationPayload } from '../entities/project';
import { ApiProjectRepository } from './ApiProjectRepository';
import type { IProjectRepository } from './interfaces';

const CACHE_KEY = 'projects';
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
  data: ProjectApiResponse[];
  timestamp: number;
}

export class CachingProjectRepository implements IProjectRepository {
  private apiRepo: ApiProjectRepository;

  constructor(apiRepo?: ApiProjectRepository) {
    this.apiRepo = apiRepo ?? new ApiProjectRepository();
  }

  async fetchAll(): Promise<ProjectEntity[]> {
    const storage = await getStorage();

    try {
      // Try to fetch fresh data
      const projects = await this.apiRepo.fetchAll();

      // Cache the result (serialize to plain objects)
      const cacheData: CachedData = {
        data: projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          color: p.color,
          status: p.status,
          tasks: p.tasks.map((t) => ({
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
          }))
        })),
        timestamp: Date.now()
      };
      await storage.set(CACHE_KEY, cacheData);

      return projects;
    } catch (error) {
      // Fallback to cache
      const cached = await storage.get<CachedData>(CACHE_KEY);
      if (cached) {
        console.warn('Using cached projects data (offline mode)');
        return cached.data.map((data) => ProjectEntity.fromApi(data));
      }
      throw error;
    }
  }

  async getById(id: string): Promise<ProjectEntity | null> {
    const projects = await this.fetchAll();
    return projects.find((p) => p.id === id) ?? null;
  }

  async update(id: string, payload: Partial<ProjectApiResponse>): Promise<ProjectEntity> {
    const storage = await getStorage();
    const updated = await this.apiRepo.update(id, payload);
    await storage.delete(CACHE_KEY);
    return updated;
  }

  async create(payload: ProjectCreationPayload) {
    const storage = await getStorage();
    const created = await this.apiRepo.create(payload);
    await storage.delete(CACHE_KEY);
    return created;
  }
}
