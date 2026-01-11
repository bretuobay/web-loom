import { Router } from 'express';
import { z } from 'zod';
import { taskService } from '../services/taskService';
import { TASK_PRIORITIES, TASK_STATUSES } from '../models/task.model';

const router = Router();

const taskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1024).optional().default(''),
  assignee: z.string().max(120).optional().default('Unassigned'),
  status: z.enum(TASK_STATUSES).optional().default('backlog'),
  priority: z.enum(TASK_PRIORITIES).optional().default('medium'),
  dueDate: z.string().optional().transform((value) => (value ? new Date(value) : null)),
  projectId: z.string().uuid()
});

const querySchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  assignee: z.string().optional(),
  projectId: z.string().uuid().optional()
});

router.get('/', async (req, res, next) => {
  try {
    const filters = querySchema.parse(req.query);
    const tasks = await taskService.list(filters);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const task = await taskService.getById(req.params.id);
    res.json(task);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = taskSchema.parse(req.body);
    const task = await taskService.create(parsed);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const payload = taskSchema.partial().parse(req.body);
    const task = await taskService.update(req.params.id, payload);
    res.json(task);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await taskService.remove(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
