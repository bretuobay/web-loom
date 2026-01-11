import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../middleware/httpErrors';
import { config } from '../config';
import { User, UserRole } from '../models/user.model';

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

    return jwt.sign(payload, config.auth.jwtSecret as string, {
      expiresIn: config.auth.expiresIn
    });
  },

  verifyToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, config.auth.jwtSecret as string) as AuthTokenPayload;
    } catch (error) {
      throw new ApiError('Invalid or expired token', 401);
    }
  },

  comparePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
};
