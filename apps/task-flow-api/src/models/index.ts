import { Project } from './project.model';
import { Task } from './task.model';

export const registerModels = () => {
  if (!Project.associations || !Project.associations.tasks) {
    Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });
  }

  if (!Task.associations || !Task.associations.project) {
    Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
  }
};

export { Project, Task };
