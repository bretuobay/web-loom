import { Router, Request, Response } from 'express';
import { SensorReading } from '../models/SensorReading';
import { Sensor } from '../models/Sensor';
import { Greenhouse } from '../models/Greenhouse';
import { z } from 'zod';

const router = Router();

// Zod Schema for SensorReading
const sensorReadingCreateSchema = z.object({
  sensorId: z.number({
    required_error: 'Sensor ID is required',
    invalid_type_error: 'Sensor ID must be a number',
  }),
  timestamp: z
    .string({ required_error: 'Timestamp is required' })
    .datetime({ message: 'Timestamp must be a valid ISO 8601 date string' }),
  value: z.number({
    required_error: 'Value is required',
    invalid_type_error: 'Value must be a number',
  }),
});

// POST /api/readings - Create a new sensor reading
router.post('/', async (req: Request, res: Response) => {
  try {
    const validationResult = sensorReadingCreateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
      });
    }
    const { sensorId, timestamp, value } = validationResult.data;

    // Check if sensor exists (still important after type validation)
    const sensor = await Sensor.findByPk(sensorId);
    if (!sensor) {
      return res.status(404).json({ message: `Sensor with id ${sensorId} not found` });
    }

    // Zod already validated the timestamp string format, new Date() should be safe
    const newReading = await SensorReading.create({
      sensorId,
      timestamp: new Date(timestamp),
      value,
    });
    res.status(201).json(newReading);
  } catch (error) {
    console.error('Error creating sensor reading:', error);
    if (error instanceof Error) {
      return res.status(500).json({
        message: 'Error creating sensor reading',
        error: error.message,
      });
    }
    res.status(500).json({ message: 'Error creating sensor reading' });
  }
});

// GET /api/readings - Read all sensor readings
router.get('/', async (req: Request, res: Response) => {
  try {
    const readings = await SensorReading.findAll({ include: [Sensor] }); // Include Sensor for context
    res.status(200).json(readings);
  } catch (error) {
    console.error('Error fetching sensor readings:', error);
    if (error instanceof Error) {
      return res.status(500).json({
        message: 'Error fetching sensor readings',
        error: error.message,
      });
    }
    res.status(500).json({ message: 'Error fetching sensor readings' });
  }
});

// GET /api/readings/:id - Read a single sensor reading by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const reading = await SensorReading.findByPk(id, { include: [Sensor] });
    if (reading) {
      res.status(200).json(reading);
    } else {
      res.status(404).json({ message: 'Sensor reading not found' });
    }
  } catch (error) {
    console.error('Error fetching sensor reading:', error);
    if (error instanceof Error) {
      return res.status(500).json({
        message: 'Error fetching sensor reading',
        error: error.message,
      });
    }
    res.status(500).json({ message: 'Error fetching sensor reading' });
  }
});

// GET /api/readings/greenhouse/:greenhouseId - Get all readings for a specific greenhouse
router.get('/greenhouse/:greenhouseId', async (req: Request, res: Response) => {
  try {
    const greenhouseId = parseInt(req.params.greenhouseId, 10);
    if (isNaN(greenhouseId)) {
      return res.status(400).json({ message: 'Invalid Greenhouse ID format' });
    }

    const greenhouse = await Greenhouse.findByPk(greenhouseId);
    if (!greenhouse) {
      return res.status(404).json({ message: `Greenhouse with id ${greenhouseId} not found` });
    }

    const readings = await SensorReading.findAll({
      include: [
        {
          model: Sensor,
          where: { greenhouseId },
          required: true, // Ensures only readings from sensors in this greenhouse are returned
          include: [Greenhouse], // Optionally include Greenhouse details on the Sensor
        },
      ],
      order: [['timestamp', 'DESC']],
    });
    res.status(200).json(readings);
  } catch (error) {
    console.error('Error fetching readings for greenhouse:', error);
    if (error instanceof Error) {
      return res.status(500).json({
        message: 'Error fetching readings for greenhouse',
        error: error.message,
      });
    }
    res.status(500).json({ message: 'Error fetching readings for greenhouse' });
  }
});

// GET /api/readings/sensor/:sensorId/history - Fetch historical data for a specific sensor
router.get('/sensor/:sensorId/history', async (req: Request, res: Response) => {
  try {
    const sensorId = parseInt(req.params.sensorId, 10);
    if (isNaN(sensorId)) {
      return res.status(400).json({ message: 'Invalid Sensor ID format' });
    }

    const sensor = await Sensor.findByPk(sensorId);
    if (!sensor) {
      return res.status(404).json({ message: `Sensor with id ${sensorId} not found` });
    }

    // Basic version: get all readings for the sensor, ordered by timestamp
    // Advanced: Parse req.query.range (e.g., '24h', '7d') to filter by date
    // For example, if range = '24h':
    // const yesterday = new Date();
    // yesterday.setDate(yesterday.getDate() - 1);
    // whereClause.timestamp = { [Op.gte]: yesterday };

    const readings = await SensorReading.findAll({
      where: { sensorId },
      order: [['timestamp', 'DESC']],
      include: [Sensor], // Optionally include Sensor details
    });
    res.status(200).json(readings);
  } catch (error) {
    console.error('Error fetching sensor history:', error);
    if (error instanceof Error) {
      return res.status(500).json({
        message: 'Error fetching sensor history',
        error: error.message,
      });
    }
    res.status(500).json({ message: 'Error fetching sensor history' });
  }
});

export default router;
