/**
 * Validation severity levels
 */
export type ValidationSeverity = 'error' | 'warning';

/**
 * Validation error codes
 */
export type ValidationErrorCode =
  // Required field errors
  | 'MISSING_INVOICE_NUMBER'
  | 'MISSING_CUSTOMER_NAME'
  | 'MISSING_LINE_ITEMS'
  | 'MISSING_UNIT_PRICE'
  | 'MISSING_DESCRIPTION'
  // Format errors
  | 'INVALID_DATE_FORMAT'
  | 'INVALID_EMAIL_FORMAT'
  | 'INVALID_NUMBER_FORMAT'
  // Business rule errors
  | 'NEGATIVE_QUANTITY'
  | 'NEGATIVE_PRICE'
  | 'DUPLICATE_INVOICE_NUMBER'
  | 'FUTURE_DATE'
  // Relationship errors
  | 'CUSTOMER_NOT_FOUND'
  | 'INVOICE_NOT_FOUND'
  // File errors
  | 'FILE_CORRUPT'
  | 'FILE_PASSWORD_PROTECTED'
  | 'FILE_TOO_LARGE'
  | 'FILE_EMPTY'
  | 'UNSUPPORTED_FORMAT'
  // Transformation
  | 'TRANSFORM_WARNING'
  // Generic
  | 'UNKNOWN_ERROR';

/**
 * Detailed validation error information
 */
export interface ValidationError {
  /** Error severity */
  severity: ValidationSeverity;
  /** Error code for programmatic handling */
  code: ValidationErrorCode;
  /** User-friendly error message */
  message: string;
  /** Additional details */
  details: {
    /** Row number in Excel (1-based) */
    rowNumber?: number;
    /** Column/field name */
    columnName?: string;
    /** Actual value that failed validation */
    value?: string;
    /** Expected format or value */
    expected?: string;
    /** Suggestion for fixing */
    suggestion?: string;
  };
}

/**
 * Validation result for a single invoice
 */
export interface InvoiceValidationResult {
  invoiceNumber: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Overall validation result
 */
export interface ValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  invoiceResults: InvoiceValidationResult[];
}

/**
 * Generate user-friendly error message
 */
export function getErrorMessage(code: ValidationErrorCode, details?: { value?: string; expected?: string }): string {
  const messages: Record<ValidationErrorCode, string> = {
    MISSING_INVOICE_NUMBER: 'Invoice number is required',
    MISSING_CUSTOMER_NAME: 'Customer name is required',
    MISSING_LINE_ITEMS: 'Invoice must have at least one line item',
    MISSING_UNIT_PRICE: 'Unit price is required for line items',
    MISSING_DESCRIPTION: 'Description is required for line items',
    INVALID_DATE_FORMAT: details?.expected
      ? `Invalid date format. Expected: ${details.expected}`
      : 'Invalid date format',
    INVALID_EMAIL_FORMAT: 'Invalid email address format',
    INVALID_NUMBER_FORMAT: 'Invalid number format',
    NEGATIVE_QUANTITY: 'Quantity cannot be negative',
    NEGATIVE_PRICE: 'Price cannot be negative',
    DUPLICATE_INVOICE_NUMBER: details?.value
      ? `Duplicate invoice number: ${details.value}`
      : 'Duplicate invoice number found',
    FUTURE_DATE: 'Invoice date is in the future',
    CUSTOMER_NOT_FOUND: 'Referenced customer not found',
    INVOICE_NOT_FOUND: 'Referenced invoice not found',
    FILE_CORRUPT: 'File appears to be corrupt. Please try re-exporting from Excel',
    FILE_PASSWORD_PROTECTED: 'File is password protected. Please remove the password and try again',
    FILE_TOO_LARGE: 'File is too large. Maximum size is 50MB',
    FILE_EMPTY: 'File contains no data rows',
    UNSUPPORTED_FORMAT: 'Unsupported file format. Please use .xlsx, .xls, or .csv',
    TRANSFORM_WARNING: 'Warning during data transformation',
    UNKNOWN_ERROR: 'An unexpected error occurred',
  };

  return messages[code] ?? 'Unknown error';
}
