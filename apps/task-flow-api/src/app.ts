import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import healthRoutes from './routes/health.routes';
import projectRoutes from './routes/projects.routes';
import taskRoutes from './routes/tasks.routes';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(morgan('tiny'));
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/health', healthRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
