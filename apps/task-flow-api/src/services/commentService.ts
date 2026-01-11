import { Comment } from '../models/comment.model.js';
import { Task } from '../models/task.model.js';
import { ApiError } from '../middleware/httpErrors.js';

export interface CommentCreationPayload {
  content: string;
  taskId: string;
  authorId: string;
}

export interface CommentUpdatePayload {
  content?: string;
}

export const commentService = {
  listByTask: (taskId: string) => {
    return Comment.findAll({
      where: { taskId },
      include: [{ association: 'author', attributes: ['id', 'displayName', 'email', 'avatarUrl'] }],
      order: [['createdAt', 'ASC']]
    });
  },

  getById: async (id: string) => {
    const comment = await Comment.findByPk(id, {
      include: [{ association: 'author', attributes: ['id', 'displayName', 'email', 'avatarUrl'] }]
    });

    if (!comment) {
      throw new ApiError('Comment not found', 404);
    }

    return comment;
  },

  create: async (payload: CommentCreationPayload) => {
    const task = await Task.findByPk(payload.taskId);
    if (!task) {
      throw new ApiError('Task not found', 404);
    }

    return Comment.create(payload);
  },

  update: async (id: string, updates: CommentUpdatePayload) => {
    const comment = await commentService.getById(id);
    return comment.update(updates);
  },

  remove: async (id: string) => {
    const comment = await commentService.getById(id);
    await comment.destroy();
    return true;
  }
};
