import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../middleware/httpErrors';
import { authenticate } from '../middleware/authenticate';
import { authService } from '../services/authService';
import { userService, sanitizeUserRecord } from '../services/userService';
import { USER_ROLES } from '../models/user.model';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = loginSchema.extend({
  displayName: z.string().min(2).max(120),
  role: z.enum(USER_ROLES).optional(),
  avatarUrl: z.string().url().optional()
});

router.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await userService.findByEmail(payload.email);
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    const isValid = await authService.comparePassword(user, payload.password);
    if (!isValid) {
      throw new ApiError('Invalid credentials', 401);
    }

    const token = authService.generateToken(user);
    res.json({
      token,
      user: sanitizeUserRecord(user)
    });
  } catch (error) {
    next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const user = await userService.create(payload);
    const storedUser = await userService.findByEmail(payload.email);
    if (!storedUser) {
      throw new ApiError('Unable to issue token for new user', 500);
    }
    const token = authService.generateToken(storedUser);
    res.status(201).json({
      token,
      user
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const user = await userService.getById(req.user.userId);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
