import { app } from './app';
import { config } from './config';
import { connectDatabase } from './database';
import { seedInitialData } from './database/seed';

export const startServer = async () => {
  try {
    await connectDatabase();
    await seedInitialData();

    app.listen(config.port, () => {
      console.info(`TaskFlow API listening on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start TaskFlow API', error);
    process.exit(1);
  }
};
