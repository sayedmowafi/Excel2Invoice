import type { ColumnMapping, Job, ProcessingSession, ProcessingStats, SheetInfo } from './session.js';
import type { ValidationResult } from './validation.js';
import type { GenerationConfig } from './config.js';
import type { Invoice } from './invoice.js';

/**
 * API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Pagination info
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// ============ Upload Endpoints ============

export interface UploadResponse {
  sessionId: string;
  fileName: string;
  fileSize: number;
  sheets: SheetInfo[];
}

// ============ Session Endpoints ============

export interface SessionResponse {
  session: ProcessingSession;
}

export interface PreviewDataResponse {
  sheets: Array<{
    name: string;
    headers: string[];
    rows: Record<string, unknown>[];
    totalRows: number;
  }>;
}

// ============ Mapping Endpoints ============

export interface SheetMappingInfo {
  name: string;
  headers: string[];
  rowCount: number;
  sampleData: Record<string, unknown>[];
}

export interface ColumnDetectionResponse {
  mappings: ColumnMapping[];
  sheetMappings?: Record<string, ColumnMapping[]>;
  sheets?: SheetMappingInfo[];
  unmappedColumns: string[];
  requiredFields: string[];
  optionalFields: string[];
  isMultiSheet?: boolean;
}

export interface SubmitMappingRequest {
  mappings: Array<{
    sourceColumn: string;
    targetField: string;
  }>;
  sheetMode: 'single' | 'multi';
  selectedSheets?: string[];
}

export interface RelationshipResponse {
  detected: boolean;
  relationships?: {
    customersSheet?: string;
    invoicesSheet?: string;
    itemsSheet?: string;
    customerIdColumn?: string;
    invoiceIdColumn?: string;
  };
}

// ============ Validation Endpoints ============

export interface DemoLimitInfo {
  applied: boolean;
  maxInvoices: number;
  originalCount: number;
}

export interface ValidationResponse {
  result: ValidationResult;
  invoices: Invoice[];
  stats: ProcessingStats;
  demoLimit?: DemoLimitInfo;
}

// ============ Configuration Endpoints ============

export interface ConfigRequest {
  config: GenerationConfig;
}

export interface LogoUploadResponse {
  logoUrl: string;
  width: number;
  height: number;
}

// ============ Generation Endpoints ============

export interface GenerateRequest {
  config?: GenerationConfig;
}

export interface GenerateResponse {
  jobId: string;
  totalInvoices: number;
  estimatedTime: number; // seconds
}

export interface JobStatusResponse {
  job: Job;
}

// ============ WebSocket Events ============

export interface ProgressEvent {
  type: 'progress';
  jobId: string;
  progress: number;
  total: number;
  currentInvoice: string;
  percentage: number;
}

export interface CompletedEvent {
  type: 'completed';
  jobId: string;
  stats: ProcessingStats;
  downloadUrl: string;
}

export interface ErrorEvent {
  type: 'error';
  jobId: string;
  error: string;
  failedInvoices: string[];
}

export type WebSocketEvent = ProgressEvent | CompletedEvent | ErrorEvent;

// ============ Download Endpoints ============

export interface InvoiceListResponse {
  invoices: Array<{
    invoiceNumber: string;
    customerName: string;
    total: number;
    status: 'generated' | 'failed';
    pdfUrl?: string;
  }>;
}

// ============ Email Endpoints ============

export interface EmailConfigRequest {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
}

export interface EmailTestRequest {
  to: string;
}

export interface SendEmailsRequest {
  subject: string;
  body: string;
  invoiceNumbers?: string[]; // If not provided, send all
}

export interface EmailStatusResponse {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  details: Array<{
    invoiceNumber: string;
    email: string;
    status: 'sent' | 'failed' | 'pending';
    error?: string;
    sentAt?: Date;
  }>;
}

// ============ History Endpoints ============

export interface HistoryItem {
  jobId: string;
  sessionId: string;
  fileName: string;
  totalInvoices: number;
  successCount: number;
  failCount: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface HistoryListResponse extends PaginatedResponse<HistoryItem> {}

export interface HistoryDetailResponse {
  job: HistoryItem;
  config: GenerationConfig;
  invoices: Array<{
    invoiceNumber: string;
    customerName: string;
    total: number;
    status: 'generated' | 'failed';
  }>;
}
