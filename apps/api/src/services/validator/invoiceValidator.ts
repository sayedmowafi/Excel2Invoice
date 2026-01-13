import type {
  Invoice,
  ValidationResult,
  ValidationError,
  InvoiceValidationResult,
} from '@excel-to-invoice/shared';
import { getErrorMessage } from '@excel-to-invoice/shared';

/**
 * Validate an array of invoices
 */
export function validateInvoices(invoices: Invoice[]): ValidationResult {
  const invoiceResults: InvoiceValidationResult[] = [];
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];
  const seenInvoiceNumbers = new Set<string>();

  let validRows = 0;
  let errorRows = 0;
  let warningRows = 0;

  for (const invoice of invoices) {
    const result = validateSingleInvoice(invoice, seenInvoiceNumbers);
    invoiceResults.push(result);

    // Update invoice status
    if (result.errors.length > 0) {
      invoice.status = 'error';
      invoice.validationErrors = result.errors.map((e) => e.message);
      errorRows++;
    } else if (result.warnings.length > 0) {
      invoice.status = 'warning';
      invoice.validationErrors = result.warnings.map((w) => w.message);
      warningRows++;
    } else {
      invoice.status = 'valid';
      validRows++;
    }

    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);

    // Track seen invoice numbers
    seenInvoiceNumbers.add(invoice.invoiceNumber);
  }

  return {
    isValid: errorRows === 0,
    totalRows: invoices.length,
    validRows,
    errorRows,
    warningRows,
    errors: allErrors,
    warnings: allWarnings,
    invoiceResults,
  };
}

/**
 * Validate a single invoice
 */
function validateSingleInvoice(
  invoice: Invoice,
  seenInvoiceNumbers: Set<string>
): InvoiceValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const rowNumber = invoice.rowNumbers?.[0];

  // Check required fields
  if (!invoice.invoiceNumber || invoice.invoiceNumber.trim() === '') {
    errors.push(createError('MISSING_INVOICE_NUMBER', rowNumber));
  }

  if (!invoice.customer.name || invoice.customer.name.trim() === '' || invoice.customer.name === 'Unknown Customer') {
    errors.push(createError('MISSING_CUSTOMER_NAME', rowNumber, 'customerName'));
  }

  if (invoice.lineItems.length === 0) {
    errors.push(createError('MISSING_LINE_ITEMS', rowNumber));
  }

  // Check for duplicate invoice numbers
  if (seenInvoiceNumbers.has(invoice.invoiceNumber)) {
    warnings.push(createWarning('DUPLICATE_INVOICE_NUMBER', rowNumber, 'invoiceNumber', invoice.invoiceNumber));
  }

  // Validate line items
  for (let i = 0; i < invoice.lineItems.length; i++) {
    const item = invoice.lineItems[i];
    if (!item) continue;

    const itemRow = invoice.rowNumbers?.[i] ?? rowNumber;

    if (!item.description || item.description.trim() === '' || item.description === 'Item') {
      warnings.push(createWarning('MISSING_DESCRIPTION', itemRow, 'description'));
    }

    if (item.quantity < 0) {
      errors.push(createError('NEGATIVE_QUANTITY', itemRow, 'quantity', String(item.quantity)));
    }

    if (item.unitPrice < 0) {
      errors.push(createError('NEGATIVE_PRICE', itemRow, 'unitPrice', String(item.unitPrice)));
    }
  }

  // Validate email format if provided
  if (invoice.customer.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(invoice.customer.email)) {
      warnings.push(createWarning('INVALID_EMAIL_FORMAT', rowNumber, 'customerEmail', invoice.customer.email));
    }
  }

  // Check for future dates
  if (invoice.issueDate > new Date()) {
    warnings.push(createWarning('FUTURE_DATE', rowNumber, 'issueDate'));
  }

  return {
    invoiceNumber: invoice.invoiceNumber,
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Create an error object
 */
function createError(
  code: ValidationError['code'],
  rowNumber?: number,
  columnName?: string,
  value?: string
): ValidationError {
  return {
    severity: 'error',
    code,
    message: `Row ${rowNumber ?? 'unknown'}: ${getErrorMessage(code, { value })}`,
    details: {
      rowNumber,
      columnName,
      value,
    },
  };
}

/**
 * Create a warning object
 */
function createWarning(
  code: ValidationError['code'],
  rowNumber?: number,
  columnName?: string,
  value?: string
): ValidationError {
  return {
    severity: 'warning',
    code,
    message: `Row ${rowNumber ?? 'unknown'}: ${getErrorMessage(code, { value })}`,
    details: {
      rowNumber,
      columnName,
      value,
    },
  };
}
