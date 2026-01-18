import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { profileService } from '../services/profileService.js';
import { ApiError } from '../middleware/httpErrors.js';

const router = Router();

const profileSchema = z.object({
  displayName: z.string().min(2).max(120).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  preferences: z
    .object({
      theme: z.enum(['light', 'dark']).optional(),
    })
    .optional(),
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401);
    }
    const profile = await profileService.getProfile(req.user.userId);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.put('/', authenticate, async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401);
    }
    const payload = profileSchema.parse(req.body);
    const updated = await profileService.updateProfile(req.user.userId, payload);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
