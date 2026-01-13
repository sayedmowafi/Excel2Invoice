import { z } from 'zod';
import { customerSchema } from './customer.schema.js';

export const discountSchema = z.object({
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0, 'Discount value cannot be negative'),
});

export const invoiceLineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0, 'Quantity cannot be negative').default(1),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  discount: discountSchema.optional(),
  taxRate: z.number().min(0).max(100).optional(),
  taxAmount: z.number().optional(),
  lineTotal: z.number(),
  sku: z.string().optional(),
  hsnCode: z.string().optional(),
});

export const invoiceStatusSchema = z.enum(['valid', 'warning', 'error']);

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  customer: customerSchema,
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  lineItems: z.array(invoiceLineItemSchema).min(1, 'At least one line item is required'),

  // Monetary
  currency: z.string().length(3, 'Currency must be a 3-letter ISO code'),
  subtotal: z.number(),
  totalTax: z.number(),
  totalDiscount: z.number(),
  grandTotal: z.number(),
  amountPaid: z.number().optional(),
  balanceDue: z.number().optional(),

  // Metadata
  notes: z.string().optional(),
  terms: z.string().optional(),
  poNumber: z.string().optional(),

  // Processing
  status: invoiceStatusSchema,
  validationErrors: z.array(z.string()).optional(),
  rowNumbers: z.array(z.number()).optional(),
});

export const invoiceInputSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  customer: customerSchema,
  issueDate: z.union([z.string(), z.date()]),
  dueDate: z.union([z.string(), z.date()]).optional(),
  lineItems: z.array(invoiceLineItemSchema).min(1, 'At least one line item is required'),
  currency: z.string().length(3, 'Currency must be a 3-letter ISO code'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  poNumber: z.string().optional(),
});

export type DiscountSchema = z.infer<typeof discountSchema>;
export type InvoiceLineItemSchema = z.infer<typeof invoiceLineItemSchema>;
export type InvoiceStatusSchema = z.infer<typeof invoiceStatusSchema>;
export type InvoiceSchema = z.infer<typeof invoiceSchema>;
export type InvoiceInputSchema = z.infer<typeof invoiceInputSchema>;
