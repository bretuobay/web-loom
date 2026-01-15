import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import healthRoutes from './routes/health.routes.js';
import projectRoutes from './routes/projects.routes.js';
import taskRoutes from './routes/tasks.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import commentRoutes from './routes/comments.routes.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './config/index.js';

const app = express();

app.use(morgan('tiny'));
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/users', userRoutes);
app.use('/comments', commentRoutes);

app.use('/uploads', express.static(config.app.uploadsPath));

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
