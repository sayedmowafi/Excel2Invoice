import { type Request, type Response, type NextFunction } from 'express';

/**
 * Request logging middleware (silent mode)
 */
export function requestLogger(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Logging disabled for cleaner output
  next();
}
