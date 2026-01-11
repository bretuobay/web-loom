import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { userService } from '../services/userService';
import { USER_ROLES } from '../models/user.model';

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(120),
  password: z.string().min(6),
  role: z.enum(USER_ROLES).optional(),
  avatarUrl: z.string().url().optional()
});

const updateSchema = z
  .object({
    displayName: z.string().min(2).max(120).optional(),
    password: z.string().min(6).optional(),
    role: z.enum(USER_ROLES).optional(),
    avatarUrl: z.string().url().optional().nullable()
  })
  .partial();

router.get('/', async (_req, res, next) => {
  try {
    const users = await userService.list();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await userService.getById(req.params.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = createSchema.parse(req.body);
    const user = await userService.create(payload);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const payload = updateSchema.parse(req.body);
    const user = await userService.update(req.params.id, payload);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await userService.remove(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
