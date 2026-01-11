import { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import { User } from '../models/User';
import { hashSessionToken } from '../services/auth';

export interface AuthenticatedRequest extends Request {
  authUser?: User;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = header.split(' ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ message: 'Authorization token missing' });
  }

  const tokenHash = hashSessionToken(token);
  const user = await User.findOne({
    where: {
      sessionTokenHash: tokenHash,
      sessionTokenExpiresAt: {
        [Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  (req as AuthenticatedRequest).authUser = user;
  next();
}
