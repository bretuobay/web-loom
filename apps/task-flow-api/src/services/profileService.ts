import { userService } from './userService.js';
import type { UserPreferences } from '../models/user.model.js';

export interface ProfileUpdatePayload {
  displayName?: string;
  avatarUrl?: string | null;
  preferences?: UserPreferences | null;
}

export const profileService = {
  getProfile: (userId: string) => userService.getById(userId),
  updateProfile: (userId: string, data: ProfileUpdatePayload) => userService.update(userId, data),
};
