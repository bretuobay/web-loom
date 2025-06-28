import express, { Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import { sequelize } from './models'; // Models should be imported from ./models/index.ts
import greenhouseRoutes from './routes/greenhouse'; // Import greenhouse routes
import sensorRoutes from './routes/sensor'; // Import sensor routes
import sensorReadingRoutes from './routes/sensorReading'; // Import sensor reading routes
import thresholdAlertRoutes from './routes/thresholdAlert'; // Import threshold alert routes

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4200',
  'http://localhost:5175',
  'http://localhost:53710',
];

const corsOptions: CorsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not ' + 'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }

    return callback(null, true);
  },
};

const app = express();
const PORT = process.env.PORT || 3700;

// Enable CORS with specified options
app.use(cors(corsOptions));
// Middleware
app.use(express.json());

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

// Mount greenhouse routes
app.use('/api/greenhouses', greenhouseRoutes);

// Mount sensor routes
app.use('/api/sensors', sensorRoutes);

// Mount sensor reading routes
app.use('/api/readings', sensorReadingRoutes);

// Mount threshold alert routes
app.use('/api/alerts', thresholdAlertRoutes);

// Initialize Sequelize and start server
const startServer = async () => {
  try {
    await sequelize.sync(); // Sync all defined models to the DB.
    console.log('Connection to database has been established successfully.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1); // Exit if DB connection fails
  }
};

startServer();
