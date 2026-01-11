import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { projectService } from '../services/projectService';
import { PROJECT_STATUSES } from '../models/project.model';

const router = Router();
router.use(authenticate);

const projectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1024).optional().default(''),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#60a5fa'),
  status: z.enum(PROJECT_STATUSES).optional().default('planning')
});

router.get('/', async (_req, res, next) => {
  try {
    const data = await projectService.list();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = projectSchema.parse(req.body);
    const project = await projectService.create(payload);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const project = await projectService.getById(req.params.id);
    res.json(project);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const payload = projectSchema.partial().parse(req.body);
    const project = await projectService.update(req.params.id, payload);
    res.json(project);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await projectService.remove(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
