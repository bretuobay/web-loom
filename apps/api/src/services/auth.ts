import crypto from 'crypto';
import { promisify } from 'util';
import { User } from '../models/User';

const scryptAsync = promisify(crypto.scrypt);
const PASSWORD_KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const SESSION_TOKEN_BYTES = 32;
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS) || 1000 * 60 * 60 * 8;

export interface SessionPayload {
  token: string;
  expiresAt: Date;
}

export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const usedSalt = salt || crypto.randomBytes(SALT_LENGTH).toString('hex');
  const derivedKey = (await scryptAsync(password, usedSalt, PASSWORD_KEY_LENGTH)) as Buffer;
  return {
    hash: derivedKey.toString('hex'),
    salt: usedSalt,
  };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const derivedKey = (await scryptAsync(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return derivedKey.toString('hex') === hash;
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createRawToken(): string {
  return crypto.randomBytes(SESSION_TOKEN_BYTES).toString('hex');
}

export async function createSessionForUser(user: User): Promise<SessionPayload> {
  const token = createRawToken();
  const hashedToken = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  user.sessionTokenHash = hashedToken;
  user.sessionTokenExpiresAt = expiresAt;
  await user.save();
  return { token, expiresAt };
}

export const SESSION_DURATION_MS = SESSION_TTL_MS;
