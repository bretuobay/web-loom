import { z } from 'zod';

export const UserSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type UserData = z.infer<typeof UserSchema>;

export const AuthTokenResponseSchema = z.object({
  message: z.string(),
  user: UserSchema,
  token: z.string(),
  expiresAt: z.string().datetime(),
});

export type AuthTokenResponseData = z.infer<typeof AuthTokenResponseSchema>;
