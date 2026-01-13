import { type Request, type Response, type NextFunction } from 'express';

/**
 * Request logging middleware
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const { method, url } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    const logFn = logLevel === 'error' ? console.error : logLevel === 'warn' ? console.warn : console.log;

    logFn(`${method} ${url} ${statusCode} ${duration}ms`);
  });

  next();
}
