import { RequestHandler } from 'express';
import { ApiError } from './httpErrors.js';
import { authService } from '../services/authService.js';

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError('Authorization token missing', 401);
  }

  const token = header.replace('Bearer ', '').trim();
  if (!token) {
    throw new ApiError('Invalid Authorization header', 401);
  }

  const payload = authService.verifyToken(token);
  req.user = payload;

  return next();
};
