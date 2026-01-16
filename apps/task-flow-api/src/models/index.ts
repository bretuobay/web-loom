import { Project } from './project.model.js';
import { Task } from './task.model.js';
import { User } from './user.model.js';
import { Comment } from './comment.model.js';
import { Attachment } from './attachment.model.js';
import { Todo } from './todo.model.js';

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

  if (!Task.associations || !Task.associations.attachments) {
    Task.hasMany(Attachment, { foreignKey: 'taskId', as: 'attachments' });
  }

  if (!Attachment.associations || !Attachment.associations.task) {
    Attachment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
  }

  if (!Comment.associations || !Comment.associations.author) {
    Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
  }

  if (!User.associations || !User.associations.comments) {
    User.hasMany(Comment, { foreignKey: 'authorId', as: 'comments' });
  }

  if (!User.associations || !User.associations.todos) {
    User.hasMany(Todo, { foreignKey: 'userId', as: 'todos' });
  }

  if (!Todo.associations || !Todo.associations.owner) {
    Todo.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
  }
};

export { Project, Task, User, Comment, Attachment, Todo };
