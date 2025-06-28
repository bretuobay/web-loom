import { Router, Request, Response } from 'express';
import { Greenhouse } from '../models/Greenhouse'; // Adjusted path
import { z } from 'zod';

const router = Router();

// Zod Schemas for Greenhouse
const greenhouseCreateSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).min(1, 'Name cannot be empty'),
  location: z.string({ required_error: 'Location is required' }).min(1, 'Location cannot be empty'),
  size: z.string({ required_error: 'Size is required' }).min(1, 'Size cannot be empty'),
  cropType: z.string().optional(),
});

const greenhouseUpdateSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  location: z.string().min(1, 'Location cannot be empty').optional(),
  size: z.string().min(1, 'Size cannot be empty').optional(),
  cropType: z.string().optional(),
});

// POST /api/greenhouses - Create a new greenhouse
router.post('/', async (req: Request, res: Response) => {
  try {
    const validationResult = greenhouseCreateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
      });
    }
    const { name, location, size, cropType } = validationResult.data;
    const newGreenhouse = await Greenhouse.create({
      name,
      location,
      size,
      cropType,
    });
    res.status(201).json(newGreenhouse);
  } catch (error) {
    console.error('Error creating greenhouse:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Error creating greenhouse', error: error.message });
    }
    res.status(500).json({ message: 'Error creating greenhouse' });
  }
});

// GET /api/greenhouses - Read all greenhouses
router.get('/', async (req: Request, res: Response) => {
  try {
    const greenhouses = await Greenhouse.findAll();
    res.status(200).json(greenhouses);
  } catch (error) {
    console.error('Error fetching greenhouses:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Error fetching greenhouses', error: error.message });
    }
    res.status(500).json({ message: 'Error fetching greenhouses' });
  }
});

// GET /api/greenhouses/:id - Read a single greenhouse by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const greenhouse = await Greenhouse.findByPk(id);
    if (greenhouse) {
      res.status(200).json(greenhouse);
    } else {
      res.status(404).json({ message: 'Greenhouse not found' });
    }
  } catch (error) {
    console.error('Error fetching greenhouse:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Error fetching greenhouse', error: error.message });
    }
    res.status(500).json({ message: 'Error fetching greenhouse' });
  }
});

// PUT /api/greenhouses/:id - Update an existing greenhouse by id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const greenhouse = await Greenhouse.findByPk(id);
    if (greenhouse) {
      const validationResult = greenhouseUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      // Ensure there's something to update if the body is not empty
      if (Object.keys(validationResult.data).length === 0 && Object.keys(req.body).length > 0) {
        // This case handles if all fields are optional and none are provided,
        // but the body itself isn't empty (e.g. extraneous fields were sent)
        // Zod might pass this if all valid fields are optional and absent.
        // However, our update logic below handles partial updates correctly.
      }

      await greenhouse.update(validationResult.data);
      res.status(200).json(greenhouse);
    } else {
      res.status(404).json({ message: 'Greenhouse not found' });
    }
  } catch (error) {
    console.error('Error updating greenhouse:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Error updating greenhouse', error: error.message });
    }
    res.status(500).json({ message: 'Error updating greenhouse' });
  }
});

// DELETE /api/greenhouses/:id - Delete a greenhouse by id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const greenhouse = await Greenhouse.findByPk(id);
    if (greenhouse) {
      await greenhouse.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Greenhouse not found' });
    }
  } catch (error) {
    console.error('Error deleting greenhouse:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Error deleting greenhouse', error: error.message });
    }
    res.status(500).json({ message: 'Error deleting greenhouse' });
  }
});

export default router;
