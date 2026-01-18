import { Task, TaskCreationAttributes } from '../models/task.model.js';
import { ApiError } from '../middleware/httpErrors.js';

export interface TaskFilters {
  status?: string;
  assigneeName?: string;
  assigneeId?: string;
  projectId?: string;
}

const defaultIncludes = [
  { association: 'project' },
  {
    association: 'assignee',
    attributes: ['id', 'displayName', 'email', 'avatarUrl', 'role'],
  },
  {
    association: 'comments',
    include: [{ association: 'author', attributes: ['id', 'displayName', 'email', 'avatarUrl'] }],
  },
  {
    association: 'attachments',
    attributes: ['id', 'originalName', 'mimeType', 'size', 'storedName', 'downloadUrl', 'createdAt', 'updatedAt'],
  },
];

export const taskService = {
  list: async (filters: TaskFilters = {}) => {
    const where: Record<string, unknown> = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.assigneeName) {
      where.assigneeName = filters.assigneeName;
    }
    if (filters.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    return Task.findAll({
      where,
      include: defaultIncludes,
      order: [['dueDate', 'ASC']],
    });
  },

  getById: async (id: string) => {
    const task = await Task.findByPk(id, {
      include: defaultIncludes,
    });
    if (!task) {
      throw new ApiError('Task not found', 404);
    }
    return task;
  },

  create: async (payload: TaskCreationAttributes) => {
    const task = await Task.create(payload);
    return taskService.getById(task.id);
  },

  update: async (id: string, updates: Partial<TaskCreationAttributes>) => {
    const task = await Task.findByPk(id);
    if (!task) {
      throw new ApiError('Task not found', 404);
    }
    await task.update(updates);
    return taskService.getById(id);
  },

  remove: async (id: string) => {
    const task = await Task.findByPk(id);
    if (!task) {
      throw new ApiError('Task not found', 404);
    }
    await task.destroy();
    return true;
  },
};
