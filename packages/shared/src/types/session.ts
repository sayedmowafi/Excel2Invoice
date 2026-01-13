import type { GenerationConfig } from './config.js';
import type { Invoice } from './invoice.js';

/**
 * Statistics about processed invoices
 */
export interface ProcessingStats {
  total: number;
  valid: number;
  warnings: number;
  errors: number;
}

/**
 * Excel sheet information
 */
export interface SheetInfo {
  name: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  sampleData: Record<string, unknown>[];
}

/**
 * Column mapping from Excel to internal fields
 */
export interface ColumnMapping {
  /** Excel column header */
  sourceColumn: string;
  /** Internal field name (null if unmapped) */
  targetField: string | null;
  /** Auto-detection confidence score (0-100) */
  confidence: number;
  /** Sample values from this column */
  sampleValues: string[];
  /** Sheet name (for multi-sheet files) */
  sheetName?: string;
}

/**
 * Session step/stage in the processing flow
 */
export type SessionStep =
  | 'upload'
  | 'sheets'
  | 'mapping'
  | 'validation'
  | 'company'
  | 'template'
  | 'config'
  | 'preview'
  | 'generating'
  | 'complete'
  | 'error';

/**
 * Processing session state
 */
export interface ProcessingSession {
  /** Unique session identifier */
  id: string;
  /** Upload timestamp */
  uploadedAt: Date;
  /** Original uploaded file name */
  originalFileName: string;
  /** File size in bytes */
  fileSize: number;
  /** Current processing step */
  currentStep: SessionStep;
  /** Detected sheets in Excel file */
  sheets: SheetInfo[];
  /** Selected sheet mode */
  sheetMode?: 'single' | 'multi';
  /** Selected sheets for processing */
  selectedSheets?: string[];
  /** Column mappings */
  columnMappings?: ColumnMapping[];
  /** Generation configuration */
  config?: GenerationConfig;
  /** Processed invoices */
  invoices: Invoice[];
  /** Processing statistics */
  stats: ProcessingStats;
  /** Session expiry timestamp */
  expiresAt: Date;
}

/**
 * Job status for background processing
 */
export type JobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Background job information
 */
export interface Job {
  id: string;
  sessionId: string;
  status: JobStatus;
  progress: number;
  total: number;
  currentInvoice?: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}
