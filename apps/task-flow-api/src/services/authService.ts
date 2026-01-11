import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { ApiError } from '../middleware/httpErrors.js';
import { config } from '../config/index.js';
import { User, UserRole } from '../models/user.model.js';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const authService = {
  generateToken(user: User): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const options: SignOptions = {
      expiresIn: config.auth.expiresIn as StringValue
    };
    return jwt.sign(payload, config.auth.jwtSecret as Secret, options);
  },

  verifyToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, config.auth.jwtSecret as Secret) as AuthTokenPayload;
    } catch (error) {
      throw new ApiError('Invalid or expired token', 401);
    }
  },

  comparePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
};
