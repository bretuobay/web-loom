import { Router, Request, Response } from 'express';
import { ThresholdAlert } from '../models/ThresholdAlert';
import { Greenhouse } from '../models/Greenhouse'; // For validating greenhouseId
// import { Sensor } from '../models/Sensor'; // No longer strictly needed here due to Zod enum
import { z } from 'zod';

const router = Router();

const validSensorTypes = ['temperature', 'humidity', 'soilMoisture', 'lightIntensity'] as const;

// Zod Schemas for ThresholdAlert
const thresholdAlertBaseSchema = z
  .object({
    greenhouseId: z.number({
      required_error: 'Greenhouse ID is required',
      invalid_type_error: 'Greenhouse ID must be a number',
    }),
    sensorType: z.enum(validSensorTypes, {
      required_error: 'Sensor type is required',
    }),
    minValue: z.number({
      required_error: 'Minimum value is required',
      invalid_type_error: 'Minimum value must be a number',
    }),
    maxValue: z.number({
      required_error: 'Maximum value is required',
      invalid_type_error: 'Maximum value must be a number',
    }),
  })
  .refine((data) => data.minValue < data.maxValue, {
    message: 'minValue must be less than maxValue',
    path: ['minValue'], // You can also point to 'maxValue' or make it a general error
  });

const thresholdAlertCreateSchema = thresholdAlertBaseSchema;

const thresholdAlertUpdateSchema = z
  .object({
    greenhouseId: z.number().optional(), // Usually not changed, but possible
    sensorType: z.enum(validSensorTypes).optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
  })
  .partial()
  .refine(
    (data) => {
      // If both are provided, they must be valid; if only one, it's fine or will be checked against DB record
      if (data.minValue !== undefined && data.maxValue !== undefined) {
        return data.minValue < data.maxValue;
      }
      return true;
    },
    {
      message: 'minValue must be less than maxValue if both are provided',
      path: ['minValue'],
    },
  );

// POST /api/alerts - Create a new threshold alert
router.post('/', async (req: Request, res: Response) => {
  try {
    const validationResult = thresholdAlertCreateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
      });
    }
    const { greenhouseId, sensorType, minValue, maxValue } = validationResult.data;

    const greenhouse = await Greenhouse.findByPk(greenhouseId);
    if (!greenhouse) {
      return res.status(404).json({ message: `Greenhouse with id ${greenhouseId} not found` });
    }

    const existingAlert = await ThresholdAlert.findOne({
      where: { greenhouseId, sensorType },
    });
    if (existingAlert) {
      return res.status(409).json({
        message: `An alert for sensor type '${sensorType}' already exists for greenhouse ID ${greenhouseId}. You can update the existing one.`,
      });
    }

    const newAlert = await ThresholdAlert.create({
      greenhouseId,
      sensorType,
      minValue,
      maxValue,
    });
    res.status(201).json(newAlert);
  } catch (error) {
    console.error('Error creating threshold alert:', error);
    if (error instanceof Error) {
      return res.status(500).json({
        message: 'Error creating threshold alert',
        error: error.message,
      });
    }
    res.status(500).json({ message: 'Error creating threshold alert' });
  }
});

// GET /api/alerts - Read all threshold alerts
router.get('/', async (req: Request, res: Response) => {
  try {
    const alerts = await ThresholdAlert.findAll({ include: [Greenhouse] });
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching threshold alerts:', error);
    if (error instanceof Error) {
      return res.status(500).json({
        message: 'Error fetching threshold alerts',
        error: error.message,
      });
    }
    res.status(500).json({ message: 'Error fetching threshold alerts' });
  }
});

// GET /api/alerts/:id - Read a single threshold alert by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const alert = await ThresholdAlert.findByPk(id, { include: [Greenhouse] });
    if (alert) {
      res.status(200).json(alert);
    } else {
      res.status(404).json({ message: 'Threshold alert not found' });
    }
  } catch (error) {
    console.error('Error fetching threshold alert:', error);
    if (error instanceof Error) {
      return res.status(500).json({
        message: 'Error fetching threshold alert',
        error: error.message,
      });
    }
    res.status(500).json({ message: 'Error fetching threshold alert' });
  }
});

// PUT /api/alerts/:id - Update an existing threshold alert by id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const alert = await ThresholdAlert.findByPk(id);
    if (alert) {
      const validationResult = thresholdAlertUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const updateData = validationResult.data;

      // Refine minValue and maxValue logic for partial updates
      const newMinValue = updateData.minValue !== undefined ? updateData.minValue : alert.minValue;
      const newMaxValue = updateData.maxValue !== undefined ? updateData.maxValue : alert.maxValue;

      if (newMinValue >= newMaxValue) {
        return res.status(400).json({
          message: 'minValue must be less than maxValue.',
          errors: { minValue: ['minValue must be less than maxValue.'] },
        });
      }

      // Check for greenhouse existence if greenhouseId is being updated
      if (updateData.greenhouseId !== undefined && updateData.greenhouseId !== alert.greenhouseId) {
        const greenhouse = await Greenhouse.findByPk(updateData.greenhouseId);
        if (!greenhouse) {
          return res.status(404).json({
            message: `Greenhouse with id ${updateData.greenhouseId} not found`,
          });
        }
        // Check for conflict in new greenhouse
        if ((updateData.sensorType && updateData.sensorType !== alert.sensorType) || !updateData.sensorType) {
          // type changing or staying same
          const newSensorType = updateData.sensorType || alert.sensorType;
          const existingAlert = await ThresholdAlert.findOne({
            where: {
              greenhouseId: updateData.greenhouseId,
              sensorType: newSensorType,
            },
          });
          if (existingAlert) {
            return res.status(409).json({
              message: `An alert for sensor type '${newSensorType}' already exists for greenhouse ID ${updateData.greenhouseId}.`,
            });
          }
        }
      }

      // Check for conflict if sensorType is changing in the same greenhouse
      if (updateData.sensorType !== undefined && updateData.sensorType !== alert.sensorType) {
        const currentGreenhouseId =
          updateData.greenhouseId !== undefined ? updateData.greenhouseId : alert.greenhouseId;
        const existingAlert = await ThresholdAlert.findOne({
          where: {
            greenhouseId: currentGreenhouseId,
            sensorType: updateData.sensorType,
          },
        });
        if (existingAlert) {
          return res.status(409).json({
            message: `An alert for sensor type '${updateData.sensorType}' already exists for greenhouse ID ${currentGreenhouseId}.`,
          });
        }
      }

      await alert.update(updateData);
      const updatedAlertWithGH = await ThresholdAlert.findByPk(id, {
        include: [Greenhouse],
      });
      res.status(200).json(updatedAlertWithGH);
    } else {
      res.status(404).json({ message: 'Threshold alert not found' });
    }
  } catch (error) {
    console.error('Error updating threshold alert:', error);
    if (error instanceof Error) {
      return res.status(500).json({
        message: 'Error updating threshold alert',
        error: error.message,
      });
    }
    res.status(500).json({ message: 'Error updating threshold alert' });
  }
});

// DELETE /api/alerts/:id - Delete a threshold alert by id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const alert = await ThresholdAlert.findByPk(id);
    if (alert) {
      await alert.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Threshold alert not found' });
    }
  } catch (error) {
    console.error('Error deleting threshold alert:', error);
    if (error instanceof Error) {
      return res.status(500).json({
        message: 'Error deleting threshold alert',
        error: error.message,
      });
    }
    res.status(500).json({ message: 'Error deleting threshold alert' });
  }
});

export default router;
