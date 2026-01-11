import { sequelize } from './client';
import { registerModels } from '../models';
import { runMigrations } from './migrations/runner';
import { migrations } from './migrations';

export const connectDatabase = async () => {
  await sequelize.authenticate();
  await runMigrations(sequelize, migrations);
  registerModels();
};

export { sequelize };
