import { sequelize } from './client';
import { registerModels } from '../models';

export const connectDatabase = async () => {
  registerModels();
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
};

export { sequelize };
