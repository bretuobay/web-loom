import { Todo } from '../models/todo.model.js';
import { ApiError } from '../middleware/httpErrors.js';

interface TodoCreateInput {
  title: string;
  details?: string;
  dueDate?: Date;
  completed?: boolean;
}

interface TodoUpdateInput {
  title?: string;
  details?: string;
  dueDate?: Date;
  completed?: boolean;
}

const ensureTodoOwnership = (todo: Todo | null, userId: string): Todo => {
  if (!todo) {
    throw new ApiError('Todo not found', 404);
  }

  if (todo.userId !== userId) {
    throw new ApiError('Unauthorized', 403);
  }

  return todo;
};

export const todoService = {
  listForUser: async (userId: string) => {
    return Todo.findAll({
      where: { userId },
      order: [
        ['dueDate', 'ASC'],
        ['createdAt', 'ASC']
      ]
    });
  },

  getByIdForUser: async (userId: string, id: string) => {
    const todo = await Todo.findByPk(id);
    return ensureTodoOwnership(todo, userId);
  },

  create: async (userId: string, payload: TodoCreateInput) => {
    const dueDate = payload.dueDate ?? new Date();
    const todo = await Todo.create({
      userId,
      title: payload.title,
      details: payload.details ?? '',
      dueDate,
      completed: payload.completed ?? false
    });
    return todo;
  },

  update: async (userId: string, id: string, updates: TodoUpdateInput) => {
    const todo = await Todo.findByPk(id);
    ensureTodoOwnership(todo, userId);
    await todo.update({
      title: updates.title ?? todo.title,
      details: updates.details ?? todo.details,
      dueDate: updates.dueDate ?? todo.dueDate,
      completed: updates.completed ?? todo.completed
    });
    return todo;
  },

  remove: async (userId: string, id: string) => {
    const todo = await Todo.findByPk(id);
    ensureTodoOwnership(todo, userId);
    await todo.destroy();
    return true;
  }
};
