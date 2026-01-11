import { ErrorRequestHandler, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from './httpErrors.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      status: 'validation_error',
      issues: error.issues
    });
  }

  console.error(error);

  return res.status(500).json({
    status: 'error',
    message: 'An unexpected error occurred'
  });
};
