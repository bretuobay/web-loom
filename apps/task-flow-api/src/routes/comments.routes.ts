import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { commentService } from '../services/commentService';
import { ApiError } from '../middleware/httpErrors';

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  taskId: z.string().uuid(),
  content: z.string().min(1).max(1024)
});

const updateSchema = z.object({
  content: z.string().min(1).max(1024).optional()
});

router.get('/task/:taskId', async (req, res, next) => {
  try {
    const comments = await commentService.listByTask(req.params.taskId);
    res.json(comments);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401);
    }

    const payload = createSchema.parse(req.body);
    const comment = await commentService.create({
      ...payload,
      authorId: req.user.userId
    });
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401);
    }

    const comment = await commentService.getById(req.params.id);
    if (comment.authorId !== req.user.userId && req.user.role !== 'admin') {
      throw new ApiError('Forbidden', 403);
    }

    const payload = updateSchema.parse(req.body);
    const updated = await commentService.update(req.params.id, payload);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401);
    }

    const comment = await commentService.getById(req.params.id);
    if (comment.authorId !== req.user.userId && req.user.role !== 'admin') {
      throw new ApiError('Forbidden', 403);
    }

    await commentService.remove(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
