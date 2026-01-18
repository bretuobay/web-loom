import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../middleware/httpErrors.js';
import { authenticate } from '../middleware/authenticate.js';
import { todoService } from '../services/todoService.js';

const router = Router();

const todoSchema = z.object({
  title: z.string().min(1).max(255),
  details: z.string().max(1024).optional().default(''),
  completed: z.boolean().optional(),
  dueDate: z.preprocess((value) => {
    if (typeof value === 'string' && value.trim() !== '') {
      return new Date(value);
    }
    return undefined;
  }, z.date().optional()),
});

const ensureUser = (userId?: string) => {
  if (!userId) {
    throw new ApiError('Unauthorized', 401);
  }
  return userId;
};

router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = ensureUser(req.user?.userId);
    const todos = await todoService.listForUser(userId);
    res.json(todos);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const userId = ensureUser(req.user?.userId);
    const payload = todoSchema.parse(req.body);
    const todo = await todoService.create(userId, payload);
    res.status(201).json(todo);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const userId = ensureUser(req.user?.userId);
    const updates = todoSchema.partial().parse(req.body);
    const updatedTodo = await todoService.update(userId, req.params.id, updates);
    res.json(updatedTodo);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const userId = ensureUser(req.user?.userId);
    await todoService.remove(userId, req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
