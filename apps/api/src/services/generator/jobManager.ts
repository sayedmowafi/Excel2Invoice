import type { Server as SocketIOServer } from 'socket.io';
import type { Job, Invoice, GenerationConfig } from '@excel-to-invoice/shared';
import { generatePdf } from './pdfGenerator.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

// Concurrency limit based on CPU cores (min 4, max 10)
const CONCURRENCY_LIMIT = Math.min(10, Math.max(4, os.cpus().length));

/**
 * In-memory job store
 */
class JobStore {
  private jobs: Map<string, Job> = new Map();

  create(id: string, sessionId: string, total: number): Job {
    const job: Job = {
      id,
      sessionId,
      status: 'pending',
      progress: 0,
      total,
      startedAt: new Date(),
    };
    this.jobs.set(id, job);
    return job;
  }

  get(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  update(id: string, updates: Partial<Job>): Job | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    const updated = { ...job, ...updates };
    this.jobs.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.jobs.delete(id);
  }
}

export const jobStore = new JobStore();

/**
 * Determine if an invoice is paid based on status or amounts
 */
function isInvoicePaid(invoice: Invoice): boolean {
  // Check explicit status field
  const statusLower = (invoice as unknown as { status?: string }).status?.toLowerCase?.() ?? '';
  if (statusLower === 'paid' || statusLower === 'complete' || statusLower === 'completed') {
    return true;
  }
  if (statusLower === 'unpaid' || statusLower === 'pending' || statusLower === 'overdue' || statusLower === 'draft') {
    return false;
  }

  // Check if amountPaid equals or exceeds grandTotal
  if (invoice.amountPaid && invoice.grandTotal) {
    return invoice.amountPaid >= invoice.grandTotal;
  }

  // Check balanceDue
  if (invoice.balanceDue !== undefined) {
    return invoice.balanceDue <= 0;
  }

  // Default to unpaid if we can't determine
  return false;
}

/**
 * Process items in parallel with concurrency limit
 */
async function processInBatches<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index];
      if (item !== undefined) {
        results[index] = await processor(item);
      }
    }
  });

  await Promise.all(workers);
  return results;
}

/**
 * Start PDF generation job
 */
export async function startGenerationJob(
  jobId: string,
  sessionId: string,
  invoices: Invoice[],
  config: GenerationConfig,
  io: SocketIOServer
): Promise<void> {
  // Create job
  jobStore.create(jobId, sessionId, invoices.length);

  // Update status
  jobStore.update(jobId, { status: 'processing' });

  // Create output directory with paid/unpaid subdirectories
  const outputDir = path.join(process.cwd(), 'output', sessionId);
  const paidDir = path.join(outputDir, 'paid');
  const unpaidDir = path.join(outputDir, 'unpaid');

  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(paidDir, { recursive: true });
  await fs.mkdir(unpaidDir, { recursive: true });

  const generatedFiles: Array<{ path: string; folder: 'paid' | 'unpaid' }> = [];
  const failedInvoices: string[] = [];

  try {
    // Progress tracking
    let completedCount = 0;
    const progressLock = { current: '' };

    // Process single invoice
    const processInvoice = async (invoice: Invoice): Promise<{ path: string; folder: 'paid' | 'unpaid' } | null> => {
      try {
        // Generate PDF
        const pdfBuffer = await generatePdf(invoice, config);

        // Determine if paid or unpaid
        const isPaid = isInvoicePaid(invoice);
        const targetDir = isPaid ? paidDir : unpaidDir;
        const folder = isPaid ? 'paid' : 'unpaid';

        // Save to file
        const filename = `${sanitizeFilename(invoice.invoiceNumber)}.pdf`;
        const filepath = path.join(targetDir, filename);
        await fs.writeFile(filepath, pdfBuffer);

        // Update progress atomically
        completedCount++;
        progressLock.current = invoice.invoiceNumber;

        // Update job store
        jobStore.update(jobId, {
          progress: completedCount,
          currentInvoice: invoice.invoiceNumber,
        });

        // Emit progress event
        io.to(sessionId).emit('progress', {
          type: 'progress',
          jobId,
          progress: completedCount,
          total: invoices.length,
          currentInvoice: invoice.invoiceNumber,
          percentage: Math.round((completedCount / invoices.length) * 100),
        });

        return { path: filepath, folder };
      } catch (error) {
        // Silent fail - tracked in failedInvoices
        completedCount++;
        failedInvoices.push(invoice.invoiceNumber);
        return null;
      }
    };

    // Process invoices in parallel batches

    const results = await processInBatches(invoices, processInvoice, CONCURRENCY_LIMIT);

    // Collect successful results
    for (const result of results) {
      if (result) {
        generatedFiles.push(result);
      }
    }

    // Create ZIP archive with folder structure
    const zipPath = path.join(outputDir, 'invoices.zip');
    await createZipArchiveWithFolders(generatedFiles, zipPath);

    // Count paid vs unpaid
    const paidCount = generatedFiles.filter(f => f.folder === 'paid').length;
    const unpaidCount = generatedFiles.filter(f => f.folder === 'unpaid').length;

    // Update job as completed
    jobStore.update(jobId, {
      status: 'completed',
      completedAt: new Date(),
    });

    // Emit completed event
    io.to(sessionId).emit('completed', {
      type: 'completed',
      jobId,
      stats: {
        total: invoices.length,
        valid: generatedFiles.length,
        warnings: 0,
        errors: failedInvoices.length,
        paid: paidCount,
        unpaid: unpaidCount,
      },
      downloadUrl: `/api/generate/${sessionId}/download`,
    });
  } catch (error) {
    // Generation job failed

    jobStore.update(jobId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      completedAt: new Date(),
    });

    io.to(sessionId).emit('error', {
      type: 'error',
      jobId,
      error: error instanceof Error ? error.message : 'Unknown error',
      failedInvoices,
    });
  }
}

/**
 * Create ZIP archive with folder structure (paid/unpaid)
 */
async function createZipArchiveWithFolders(
  files: Array<{ path: string; folder: 'paid' | 'unpaid' }>,
  outputPath: string
): Promise<void> {
  const archiver = await import('archiver');
  const { createWriteStream } = await import('fs');

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver.default('zip', {
      zlib: { level: 9 },
    });

    output.on('close', () => {
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add files to their respective folders in the ZIP
    for (const file of files) {
      const filename = path.basename(file.path);
      archive.file(file.path, { name: `${file.folder}/${filename}` });
    }

    archive.finalize();
  });
}

/**
 * Sanitize filename
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}
