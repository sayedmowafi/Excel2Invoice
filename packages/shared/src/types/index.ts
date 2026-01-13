// Customer types
export type { Address, Customer, CustomerInput } from './customer.js';

// Invoice types
export type {
  Discount,
  Invoice,
  InvoiceInput,
  InvoiceLineItem,
  InvoiceStatus,
  PaymentStatus,
} from './invoice.js';

// Configuration types
export type {
  BankDetails,
  CompanyInfo,
  CurrencyPosition,
  DateFormatOption,
  FieldVisibility,
  GenerationConfig,
  InvoiceTemplate,
  NumberFormat,
} from './config.js';
export { DEFAULT_CONFIG } from './config.js';

// Session types
export type {
  ColumnMapping,
  Job,
  JobStatus,
  ProcessingSession,
  ProcessingStats,
  SessionStep,
  SheetInfo,
} from './session.js';

// Validation types
export type {
  InvoiceValidationResult,
  ValidationError,
  ValidationErrorCode,
  ValidationResult,
  ValidationSeverity,
} from './validation.js';
export { getErrorMessage } from './validation.js';

// API types
export type {
  ApiResponse,
  ColumnDetectionResponse,
  CompletedEvent,
  ConfigRequest,
  EmailConfigRequest,
  EmailStatusResponse,
  EmailTestRequest,
  ErrorEvent,
  GenerateRequest,
  GenerateResponse,
  HistoryDetailResponse,
  HistoryItem,
  HistoryListResponse,
  InvoiceListResponse,
  JobStatusResponse,
  LogoUploadResponse,
  PaginatedResponse,
  PaginationInfo,
  PreviewDataResponse,
  ProgressEvent,
  RelationshipResponse,
  SendEmailsRequest,
  SessionResponse,
  SubmitMappingRequest,
  UploadResponse,
  ValidationResponse,
  WebSocketEvent,
} from './api.js';
