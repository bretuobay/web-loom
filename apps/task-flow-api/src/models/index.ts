import { Project } from './project.model.js';
import { Task } from './task.model.js';
import { User } from './user.model.js';
import { Comment } from './comment.model.js';

export const registerModels = () => {
  if (!Project.associations || !Project.associations.tasks) {
    Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });
  }

  if (!Task.associations || !Task.associations.project) {
    Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
  }

  if (!Task.associations || !Task.associations.assignee) {
    Task.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
  }

  if (!User.associations || !User.associations.assignedTasks) {
    User.hasMany(Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });
  }

  if (!Task.associations || !Task.associations.comments) {
    Task.hasMany(Comment, { foreignKey: 'taskId', as: 'comments' });
  }

  if (!Comment.associations || !Comment.associations.task) {
    Comment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
  }

  if (!Comment.associations || !Comment.associations.author) {
    Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
  }

  if (!User.associations || !User.associations.comments) {
    User.hasMany(Comment, { foreignKey: 'authorId', as: 'comments' });
  }
};

export { Project, Task, User, Comment };
