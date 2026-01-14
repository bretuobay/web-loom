import { sequelize } from './client.js';
import { registerModels } from '../models/index.js';
import { runMigrations } from './migrations/runner.js';
import { migrations } from './migrations/index.js';

export const connectDatabase = async () => {
  await sequelize.authenticate();
  await runMigrations(sequelize, migrations);
  registerModels();
};

export { sequelize };
