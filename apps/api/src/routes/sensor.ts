import { Router, Request, Response } from 'express';
import { Sensor } from '../models/Sensor';
import { Greenhouse } from '../models/Greenhouse'; // For validating greenhouseId
import { z } from 'zod';

const router = Router();

const sensorTypes = ['temperature', 'humidity', 'soilMoisture', 'lightIntensity'] as const;
const sensorStatuses = ['active', 'inactive'] as const;

// Zod Schemas for Sensor
const sensorCreateSchema = z.object({
  type: z.enum(sensorTypes, { required_error: 'Type is required' }),
  status: z.enum(sensorStatuses, { required_error: 'Status is required' }),
  greenhouseId: z.number({
    required_error: 'Greenhouse ID is required',
    invalid_type_error: 'Greenhouse ID must be a number',
  }),
});

const sensorUpdateSchema = z.object({
  type: z.enum(sensorTypes).optional(),
  status: z.enum(sensorStatuses).optional(),
  greenhouseId: z.number().optional(),
});

// POST /api/sensors - Create a new sensor
router.post('/', async (req: Request, res: Response) => {
  try {
    const validationResult = sensorCreateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
      });
    }
    const { type, status, greenhouseId } = validationResult.data;

    // Check if greenhouse exists
    const greenhouse = await Greenhouse.findByPk(greenhouseId);
    if (!greenhouse) {
      return res.status(404).json({ message: `Greenhouse with id ${greenhouseId} not found` });
    }

    const newSensor = await Sensor.create({ type, status, greenhouseId });
    res.status(201).json(newSensor);
  } catch (error) {
    console.error('Error creating sensor:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Error creating sensor', error: error.message });
    }
    res.status(500).json({ message: 'Error creating sensor' });
  }
});

// GET /api/sensors - Read all sensors
router.get('/', async (req: Request, res: Response) => {
  try {
    const sensors = await Sensor.findAll({ include: [Greenhouse] }); // Optionally include Greenhouse info
    res.status(200).json(sensors);
  } catch (error) {
    console.error('Error fetching sensors:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Error fetching sensors', error: error.message });
    }
    res.status(500).json({ message: 'Error fetching sensors' });
  }
});

// GET /api/sensors/:id - Read a single sensor by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const sensor = await Sensor.findByPk(id, { include: [Greenhouse] });
    if (sensor) {
      res.status(200).json(sensor);
    } else {
      res.status(404).json({ message: 'Sensor not found' });
    }
  } catch (error) {
    console.error('Error fetching sensor:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Error fetching sensor', error: error.message });
    }
    res.status(500).json({ message: 'Error fetching sensor' });
  }
});

// PUT /api/sensors/:id - Update an existing sensor by id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const sensor = await Sensor.findByPk(id);
    if (sensor) {
      const validationResult = sensorUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: validationResult.error.flatten().fieldErrors,
        });
      }
      const { type, status, greenhouseId } = validationResult.data;

      // If greenhouseId is being updated, check if the new one exists
      if (greenhouseId !== undefined && greenhouseId !== sensor.greenhouseId) {
        const greenhouse = await Greenhouse.findByPk(greenhouseId);
        if (!greenhouse) {
          return res.status(404).json({ message: `Greenhouse with id ${greenhouseId} not found` });
        }
      }

      await sensor.update(validationResult.data);
      // Fetch the updated sensor with Greenhouse info to return it
      const updatedSensorWithGH = await Sensor.findByPk(id, {
        include: [Greenhouse],
      });
      res.status(200).json(updatedSensorWithGH);
    } else {
      res.status(404).json({ message: 'Sensor not found' });
    }
  } catch (error) {
    console.error('Error updating sensor:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Error updating sensor', error: error.message });
    }
    res.status(500).json({ message: 'Error updating sensor' });
  }
});

// DELETE /api/sensors/:id - Delete a sensor by id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const sensor = await Sensor.findByPk(id);
    if (sensor) {
      await sensor.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Sensor not found' });
    }
  } catch (error) {
    console.error('Error deleting sensor:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Error deleting sensor', error: error.message });
    }
    res.status(500).json({ message: 'Error deleting sensor' });
  }
});

export default router;
