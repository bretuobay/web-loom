import type { AuthTokenPayload } from '../../services/authService';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}
