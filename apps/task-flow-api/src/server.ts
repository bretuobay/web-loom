import { app } from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './database/index.js';
import { seedInitialData } from './database/seed.js';

export const startServer = async () => {
  try {
    await connectDatabase();
    await seedInitialData();

    app.listen(config.port, config.host, () => {
      console.info(`TaskFlow API listening on http://${config.host ?? 'localhost'}:${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start TaskFlow API', error);
    process.exit(1);
  }
};
