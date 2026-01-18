import { RequestHandler } from 'express';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    status: 'not_found',
    path: req.originalUrl,
    message: 'The requested endpoint was not found',
  });
};
