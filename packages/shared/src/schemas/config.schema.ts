import { z } from 'zod';

export const companyInfoSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  logo: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  taxId: z.string().optional(),
});

export const invoiceTemplateSchema = z.enum([
  'simple',
  'simple-logo',
  'professional',
  'tax-invoice',
]);

export const currencyPositionSchema = z.enum(['before', 'after']);

export const numberFormatSchema = z.object({
  decimalSeparator: z.enum(['.', ',']),
  thousandsSeparator: z.enum([',', '.', ' ', '']),
  decimalPlaces: z.number().int().min(0).max(3),
});

export const fieldVisibilitySchema = z.object({
  customerAddress: z.boolean(),
  customerEmail: z.boolean(),
  customerPhone: z.boolean(),
  dueDate: z.boolean(),
  poNumber: z.boolean(),
  taxBreakdown: z.boolean(),
  taxId: z.boolean(),
  notes: z.boolean(),
  terms: z.boolean(),
  bankDetails: z.boolean(),
});

export const bankDetailsSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  routingNumber: z.string().optional(),
  swift: z.string().optional(),
  iban: z.string().optional(),
});

export const dateFormatOptionSchema = z.enum([
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
  'DD MMM YYYY',
  'MMMM DD, YYYY',
]);

export const generationConfigSchema = z.object({
  company: companyInfoSchema,
  template: invoiceTemplateSchema,
  currency: z.string().length(3),
  currencySymbol: z.string().min(1),
  currencyPosition: currencyPositionSchema,
  dateFormat: dateFormatOptionSchema,
  numberFormat: numberFormatSchema,
  showFields: fieldVisibilitySchema,
  bankDetails: bankDetailsSchema.optional(),
  footerText: z.string().max(500).optional(),
});

export type CompanyInfoSchema = z.infer<typeof companyInfoSchema>;
export type InvoiceTemplateSchema = z.infer<typeof invoiceTemplateSchema>;
export type CurrencyPositionSchema = z.infer<typeof currencyPositionSchema>;
export type NumberFormatSchema = z.infer<typeof numberFormatSchema>;
export type FieldVisibilitySchema = z.infer<typeof fieldVisibilitySchema>;
export type BankDetailsSchema = z.infer<typeof bankDetailsSchema>;
export type DateFormatOptionSchema = z.infer<typeof dateFormatOptionSchema>;
export type GenerationConfigSchema = z.infer<typeof generationConfigSchema>;
