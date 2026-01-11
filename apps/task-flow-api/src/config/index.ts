import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const fileName = process.env.DB_FILE ?? 'db.sqlite';

export const config = {
  app: {
    name: 'TaskFlow API',
    version: '0.1.0',
  },
  env: process.env.NODE_ENV ?? 'development',
  port: 4001, // Number(process.env.PORT ?? 4000),
  database: {
    storagePath: path.resolve(rootDir, fileName),
    logging: process.env.DB_LOGGING === 'true',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? 'taskflow-api-secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h'
  }
};
