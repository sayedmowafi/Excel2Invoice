import { Router } from 'express';
import { nanoid } from 'nanoid';
import type { ApiResponse, GenerateResponse, JobStatusResponse } from '@excel-to-invoice/shared';
import { AppError } from '../middleware/errorHandler.js';
import { sessionStore } from '../services/sessionStore.js';
import { jobStore, startGenerationJob } from '../services/generator/jobManager.js';
import { generateLimiter, downloadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * POST /api/generate/:sessionId
 * Start PDF generation job
 */
router.post('/:sessionId', generateLimiter, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.get(sessionId);

    if (!session) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found or expired');
    }

    if (!session.config) {
      throw new AppError(400, 'NO_CONFIG', 'Configuration must be saved before generation');
    }

    if (session.invoices.length === 0) {
      throw new AppError(400, 'NO_INVOICES', 'No invoices to generate');
    }

    // Filter valid invoices only
    let validInvoices = session.invoices.filter((inv) => inv.status !== 'error');

    if (validInvoices.length === 0) {
      throw new AppError(400, 'NO_VALID_INVOICES', 'No valid invoices to generate');
    }

    // Apply demo limit if set
    const maxInvoices = process.env.MAX_INVOICES ? parseInt(process.env.MAX_INVOICES) : 0;
    if (maxInvoices > 0 && validInvoices.length > maxInvoices) {
      validInvoices = validInvoices.slice(0, maxInvoices);
    }

    // Create job
    const jobId = nanoid();
    const io = req.app.get('io');

    // Start generation (async)
    startGenerationJob(jobId, sessionId, validInvoices, session.config, io);

    // Estimate time (rough: 0.5s per invoice)
    const estimatedTime = Math.ceil(validInvoices.length * 0.5);

    const response: ApiResponse<GenerateResponse> = {
      success: true,
      data: {
        jobId,
        totalInvoices: validInvoices.length,
        estimatedTime,
      },
    };

    res.status(202).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/generate/:sessionId/jobs/:jobId
 * Get job status
 */
router.get('/:sessionId/jobs/:jobId', (req, res) => {
  const { sessionId, jobId } = req.params;
  const session = sessionStore.get(sessionId);

  if (!session) {
    throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found or expired');
  }

  const job = jobStore.get(jobId);

  if (!job) {
    throw new AppError(404, 'JOB_NOT_FOUND', 'Job not found');
  }

  const response: ApiResponse<JobStatusResponse> = {
    success: true,
    data: { job },
  };

  res.json(response);
});

/**
 * GET /api/generate/:sessionId/download
 * Download generated ZIP file
 */
router.get('/:sessionId/download', downloadLimiter, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.get(sessionId);

    if (!session) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found or expired');
    }

    const fs = await import('fs/promises');
    const path = await import('path');

    const outputDir = path.join(process.cwd(), 'output', sessionId);
    const zipPath = path.join(outputDir, 'invoices.zip');

    // Check if ZIP exists
    try {
      await fs.access(zipPath);
    } catch {
      throw new AppError(404, 'ZIP_NOT_FOUND', 'ZIP file not found. Please run generation first.');
    }

    // Send file
    res.download(zipPath, `invoices-${sessionId}.zip`);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/generate/:sessionId/errors
 * Download error report CSV
 */
router.get('/:sessionId/errors', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.get(sessionId);

    if (!session) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found or expired');
    }

    // Generate CSV content
    const errorInvoices = session.invoices.filter((inv) => inv.status === 'error');

    if (errorInvoices.length === 0) {
      res.status(204).send();
      return;
    }

    const csvHeader = 'Row,Invoice Number,Field,Issue,Value,Suggestion\n';
    const csvRows = errorInvoices.flatMap((inv) =>
      (inv.validationErrors ?? []).map((error) => {
        const row = inv.rowNumbers?.[0] ?? '';
        return `${row},"${inv.invoiceNumber}","","${error}","",""`;
      })
    );

    const csv = csvHeader + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="errors-${sessionId}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

export { router as generateRouter };
