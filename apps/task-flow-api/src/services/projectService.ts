import { Project, ProjectCreationAttributes } from '../models/project.model';
import { Task } from '../models/task.model';
import { ApiError } from '../middleware/httpErrors';

export const projectService = {
  list: () => {
    return Project.findAll({
      include: { model: Task, as: 'tasks' }
    });
  },

  getById: async (id: string) => {
    const project = await Project.findByPk(id, {
      include: { model: Task, as: 'tasks' }
    });

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    return project;
  },

  create: (payload: ProjectCreationAttributes) => {
    return Project.create(payload);
  },

  update: async (id: string, updates: Partial<ProjectCreationAttributes>) => {
    const project = await Project.findByPk(id);
    if (!project) {
      throw new ApiError('Project not found', 404);
    }
    return project.update(updates);
  },

  remove: async (id: string) => {
    const project = await Project.findByPk(id);
    if (!project) {
      throw new ApiError('Project not found', 404);
    }
    await project.destroy();
    return true;
  }
};
