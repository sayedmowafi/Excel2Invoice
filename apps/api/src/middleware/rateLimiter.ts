import rateLimit from 'express-rate-limit';

/**
 * Rate limiting configuration
 * Enable by setting RATE_LIMIT_ENABLED=true in .env
 */

const isEnabled = process.env.RATE_LIMIT_ENABLED === 'true';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isEnabled, // Skip if rate limiting is disabled
});

// Stricter limit for file uploads
export const uploadLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS || '3600000'), // 1 hour default
  max: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX || '10'), // 10 uploads per hour
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Too many file uploads, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isEnabled,
});

// Stricter limit for PDF generation (resource intensive)
export const generateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_GENERATE_WINDOW_MS || '3600000'), // 1 hour default
  max: parseInt(process.env.RATE_LIMIT_GENERATE_MAX || '5'), // 5 generations per hour
  message: {
    success: false,
    error: {
      code: 'GENERATE_RATE_LIMIT_EXCEEDED',
      message: 'Too many PDF generation requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isEnabled,
});
