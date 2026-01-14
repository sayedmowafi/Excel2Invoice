import { type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';
import type { ApiResponse } from '@excel-to-invoice/shared';

/**
 * Custom application error
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void {
  console.error('Error:', err);

  // Handle known AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Log all errors for debugging
  console.error('Error:', err.message, err.stack);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // Handle Multer errors
  if (err.name === 'MulterError') {
    const multerErr = err as Error & { code: string };
    let message = 'File upload error';

    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      message = 'File is too large. Maximum size is 50MB';
    } else if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    }

    res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message,
      },
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
  });
}
