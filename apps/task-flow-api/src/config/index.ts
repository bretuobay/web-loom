import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const dbFile = process.env.DB_FILE ?? 'db.sqlite';
const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 8001);
const uploadsPath = path.resolve(rootDir, 'uploads');
const baseUrlEnv = process.env.APP_URL;
const appBaseUrl = baseUrlEnv ? baseUrlEnv : `http://${host}:${port}`;

export const config = {
  app: {
    name: 'TaskFlow API',
    version: '0.1.0',
    baseUrl: appBaseUrl,
    uploadsPath,
  },
  env: process.env.NODE_ENV ?? 'development',
  port,
  host,
  database: {
    storagePath: path.resolve(rootDir, dbFile),
    logging: process.env.DB_LOGGING === 'true',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? 'taskflow-api-secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  },
};
