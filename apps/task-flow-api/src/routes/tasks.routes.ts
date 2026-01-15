import express, { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { taskService } from '../services/taskService.js';
import { TASK_PRIORITIES, TASK_STATUSES } from '../models/task.model.js';
import { attachmentService } from '../services/attachmentService.js';
import { ApiError } from '../middleware/httpErrors.js';

const router = Router();

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_ATTACHMENT_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);
const attachmentBodyParser = express.raw({ type: () => true, limit: MAX_ATTACHMENT_BYTES });

const taskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1024).optional().default(''),
  assigneeName: z.string().max(120).optional().default('Unassigned'),
  assigneeId: z.string().uuid().optional().nullable(),
  status: z.enum(TASK_STATUSES).optional().default('backlog'),
  priority: z.enum(TASK_PRIORITIES).optional().default('medium'),
  dueDate: z.string().optional().transform((value) => (value ? new Date(value) : null)),
  projectId: z.string().uuid()
});

const querySchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  assigneeName: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
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

router.post('/', authenticate, async (req, res, next) => {
  try {
    const parsed = taskSchema.parse(req.body);
    const task = await taskService.create(parsed);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/:id/attachments',
  authenticate,
  attachmentBodyParser,
  async (req, res, next) => {
    try {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        throw new ApiError('No file data provided', 400);
      }

      const rawName = req.get('x-file-name');
      if (!rawName) {
        throw new ApiError('Missing file name header', 400);
      }

      let originalName: string;
      try {
        originalName = decodeURIComponent(rawName);
      } catch {
        originalName = rawName;
      }

      const mimeType = req.get('content-type') ?? 'application/octet-stream';
      if (!ALLOWED_ATTACHMENT_TYPES.has(mimeType)) {
        throw new ApiError('Unsupported file type', 415);
      }

      if (req.body.length > MAX_ATTACHMENT_BYTES) {
        throw new ApiError('File exceeds size limit', 413);
      }

      const attachment = await attachmentService.create({
        taskId: req.params.id,
        buffer: req.body,
        originalName,
        mimeType,
        size: req.body.length
      });

      res.status(201).json(attachment);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const payload = taskSchema.partial().parse(req.body);
    const task = await taskService.update(req.params.id, payload);
    res.json(task);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await taskService.remove(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
