import { Task, TaskCreationAttributes } from '../models/task.model';
import { ApiError } from '../middleware/httpErrors';

export interface TaskFilters {
  status?: string;
  assignee?: string;
  projectId?: string;
}

export const taskService = {
  list: async (filters: TaskFilters = {}) => {
    const where: Record<string, unknown> = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.assignee) {
      where.assignee = filters.assignee;
    }
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    return Task.findAll({
      where,
      include: [{ association: 'project' }],
      order: [['dueDate', 'ASC']]
    });
  },

  getById: async (id: string) => {
    const task = await Task.findByPk(id);
    if (!task) {
      throw new ApiError('Task not found', 404);
    }
    return task;
  },

  create: (payload: TaskCreationAttributes) => {
    return Task.create(payload);
  },

  update: async (id: string, updates: Partial<TaskCreationAttributes>) => {
    const task = await Task.findByPk(id);
    if (!task) {
      throw new ApiError('Task not found', 404);
    }
    return task.update(updates);
  },

  remove: async (id: string) => {
    const task = await Task.findByPk(id);
    if (!task) {
      throw new ApiError('Task not found', 404);
    }
    await task.destroy();
    return true;
  }
};
