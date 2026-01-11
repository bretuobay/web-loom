import { ApiError } from '../middleware/httpErrors';
import { User, UserRole } from '../models/user.model';

export const sanitizeUserRecord = (user: User) => {
  const clone = user.get({ plain: true }) as Partial<User>;
  delete clone.passwordHash;
  return clone;
};

export interface CreateUserPayload {
  email: string;
  displayName: string;
  password: string;
  role?: UserRole;
  avatarUrl?: string | null;
}

export interface UpdateUserPayload {
  displayName?: string;
  password?: string;
  role?: UserRole;
  avatarUrl?: string | null;
}

export const userService = {
  list: () => {
    return User.findAll({
      attributes: { exclude: ['passwordHash'] }
    });
  },

  getById: async (id: string) => {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] }
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    return sanitizeUserRecord(user);
  },

  findByEmail: (email: string) => {
    return User.findOne({
      where: { email }
    });
  },

  create: async (payload: CreateUserPayload) => {
    const existing = await userService.findByEmail(payload.email);
    if (existing) {
      throw new ApiError('A user with that email already exists', 409);
    }

    const user = await User.create({
      email: payload.email,
      displayName: payload.displayName,
      password: payload.password,
      role: payload.role ?? 'member',
      avatarUrl: payload.avatarUrl ?? null
    });

    return sanitizeUserRecord(user);
  },

  update: async (id: string, updates: UpdateUserPayload) => {
    const user = await User.findByPk(id);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    const payload: any = {};
    if (updates.displayName !== undefined) {
      payload.displayName = updates.displayName;
    }
    if (updates.role !== undefined) {
      payload.role = updates.role;
    }
    if (updates.avatarUrl !== undefined) {
      payload.avatarUrl = updates.avatarUrl;
    }

    if (updates.password) {
      payload.password = updates.password;
    }

    return sanitizeUserRecord(await user.update(payload));
  },

  remove: async (id: string) => {
    const user = await User.findByPk(id);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    await user.destroy();
    return true;
  }
};
