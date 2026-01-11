import { Project, ProjectCreationAttributes } from '../models/project.model.js';
import { ApiError } from '../middleware/httpErrors.js';

const taskIncludes = [
  {
    association: 'assignee',
    attributes: ['id', 'displayName', 'email', 'avatarUrl', 'role']
  },
  {
    association: 'comments',
    include: [{ association: 'author', attributes: ['id', 'displayName', 'email', 'avatarUrl'] }]
  }
];

export const projectService = {
  list: () => {
    return Project.findAll({
      include: [
        {
          association: 'tasks',
          include: taskIncludes
        }
      ]
    });
  },

  getById: async (id: string) => {
    const project = await Project.findByPk(id, {
      include: [
        {
          association: 'tasks',
          include: taskIncludes
        }
      ]
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
