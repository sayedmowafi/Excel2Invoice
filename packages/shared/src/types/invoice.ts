import type { Customer } from './customer.js';

/**
 * Discount applied to a line item
 */
export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
}

/**
 * Single line item on an invoice
 */
export interface InvoiceLineItem {
  /** Item description - Required */
  description: string;
  /** Quantity - Default: 1 */
  quantity: number;
  /** Price per unit - Required */
  unitPrice: number;
  /** Optional discount */
  discount?: Discount;
  /** Tax rate as percentage (e.g., 18 for 18%) */
  taxRate?: number;
  /** Calculated or explicit tax amount */
  taxAmount?: number;
  /** Calculated line total (qty * price - discount + tax) */
  lineTotal: number;
  /** SKU/Item code/Product code */
  sku?: string;
  /** Optional HSN/SAC code for tax compliance */
  hsnCode?: string;
}

/**
 * Invoice validation status
 */
export type InvoiceStatus = 'valid' | 'warning' | 'error';

/**
 * Invoice payment status
 */
export type PaymentStatus = 'paid' | 'unpaid' | 'partial' | 'overdue' | 'pending';

/**
 * Complete invoice structure
 */
export interface Invoice {
  /** Unique invoice number - Required */
  invoiceNumber: string;
  /** Customer details */
  customer: Customer;
  /** Invoice issue date */
  issueDate: Date;
  /** Payment due date */
  dueDate?: Date;
  /** Line items on this invoice */
  lineItems: InvoiceLineItem[];

  // Monetary fields
  /** ISO 4217 currency code (USD, EUR, INR, etc.) */
  currency: string;
  /** Sum of line totals before tax */
  subtotal: number;
  /** Total tax amount */
  totalTax: number;
  /** Total discount amount */
  totalDiscount: number;
  /** Final total (subtotal - discount + tax) */
  grandTotal: number;
  /** Amount already paid */
  amountPaid?: number;
  /** Remaining balance */
  balanceDue?: number;

  // Metadata
  /** Additional notes */
  notes?: string;
  /** Payment terms */
  terms?: string;
  /** Purchase order reference number */
  poNumber?: string;

  // Processing metadata
  /** Validation status */
  status: InvoiceStatus;
  /** Payment status (paid/unpaid/partial/etc.) */
  paymentStatus?: PaymentStatus;
  /** List of validation errors/warnings */
  validationErrors?: string[];
  /** Source Excel row numbers */
  rowNumbers?: number[];
}

/**
 * Invoice input for creation (dates as strings)
 */
export interface InvoiceInput {
  invoiceNumber: string;
  customer: Customer;
  issueDate: string | Date;
  dueDate?: string | Date;
  lineItems: InvoiceLineItem[];
  currency: string;
  notes?: string;
  terms?: string;
  poNumber?: string;
}
