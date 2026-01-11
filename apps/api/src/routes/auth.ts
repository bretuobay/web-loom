import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { hashPassword, verifyPassword, createSessionForUser } from '../services/auth';
import { requireAuth, AuthenticatedRequest } from '../middleware/authenticate';

const router = Router();

const signUpSchema = z.object({
  email: z.string().email({ message: 'Email must be valid' }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const signInSchema = z.object({
  email: z.string().email({ message: 'Email must be valid' }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Current password must be at least 8 characters'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const sanitizeUser = (user: User) => {
  const { id, email, firstName, lastName, createdAt, updatedAt } = user;
  return { id, email, firstName, lastName, createdAt, updatedAt };
};

const formatErrors = (errors: z.ZodError) => {
  return errors.flatten().fieldErrors;
};

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const validationResult = signUpSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ message: 'Validation failed', errors: formatErrors(validationResult.error) });
    }

    const { email, password, firstName, lastName } = validationResult.data;
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const { hash, salt } = await hashPassword(password);
    const user = await User.create({
      email,
      passwordHash: hash,
      passwordSalt: salt,
      firstName,
      lastName,
    });
    const session = await createSessionForUser(user);

    res.status(201).json({
      message: 'Account created',
      user: sanitizeUser(user),
      token: session.token,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('Error signing up user:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Unable to create account', error: error.message });
    }
    res.status(500).json({ message: 'Unable to create account' });
  }
});

router.post('/signin', async (req: Request, res: Response) => {
  try {
    const validationResult = signInSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ message: 'Validation failed', errors: formatErrors(validationResult.error) });
    }

    const { email, password } = validationResult.data;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const session = await createSessionForUser(user);
    res.status(200).json({
      message: 'Signed in',
      user: sanitizeUser(user),
      token: session.token,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('Error signing in user:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Unable to sign in', error: error.message });
    }
    res.status(500).json({ message: 'Unable to sign in' });
  }
});

router.get('/me', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.authUser) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.status(200).json({ user: sanitizeUser(authReq.authUser) });
});

router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const validationResult = changePasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ message: 'Validation failed', errors: formatErrors(validationResult.error) });
    }

    const authReq = req as AuthenticatedRequest;
    if (!authReq.authUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = validationResult.data;
    const isCurrentValid = await verifyPassword(currentPassword, authReq.authUser.passwordHash, authReq.authUser.passwordSalt);
    if (!isCurrentValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const { hash, salt } = await hashPassword(newPassword);
    authReq.authUser.passwordHash = hash;
    authReq.authUser.passwordSalt = salt;
    const session = await createSessionForUser(authReq.authUser);

    res.status(200).json({
      message: 'Password updated',
      user: sanitizeUser(authReq.authUser),
      token: session.token,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('Error changing password:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Unable to change password', error: error.message });
    }
    res.status(500).json({ message: 'Unable to change password' });
  }
});

router.post('/signout', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.authUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    authReq.authUser.sessionTokenHash = null;
    authReq.authUser.sessionTokenExpiresAt = null;
    await authReq.authUser.save();
    res.status(204).send();
  } catch (error) {
    console.error('Error signing out:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Unable to sign out', error: error.message });
    }
    res.status(500).json({ message: 'Unable to sign out' });
  }
});

export default router;
