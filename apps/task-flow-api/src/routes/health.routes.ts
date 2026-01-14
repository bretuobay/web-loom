import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    message: 'TaskFlow API is healthy'
  });
});

export default router;
