/**
 * Company information that appears on invoices
 */
export interface CompanyInfo {
  /** Company name - Required */
  name: string;
  /** Company logo as base64 data URL */
  logo?: string;
  /** Company address (multi-line) */
  address?: string;
  /** Phone number */
  phone?: string;
  /** Email address */
  email?: string;
  /** Website URL */
  website?: string;
  /** Tax ID (VAT/GST/EIN) */
  taxId?: string;
}

/**
 * Available invoice templates
 */
export type InvoiceTemplate = 'simple' | 'simple-logo' | 'professional' | 'tax-invoice';

/**
 * Currency symbol position
 */
export type CurrencyPosition = 'before' | 'after';

/**
 * Number formatting options
 */
export interface NumberFormat {
  decimalSeparator: '.' | ',';
  thousandsSeparator: ',' | '.' | ' ' | '';
  decimalPlaces: number;
}

/**
 * Field visibility toggles
 */
export interface FieldVisibility {
  customerAddress: boolean;
  customerEmail: boolean;
  customerPhone: boolean;
  dueDate: boolean;
  poNumber: boolean;
  taxBreakdown: boolean;
  taxId: boolean;
  notes: boolean;
  terms: boolean;
  bankDetails: boolean;
}

/**
 * Bank details for payment information
 */
export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  swift?: string;
  iban?: string;
}

/**
 * Available date formats
 */
export type DateFormatOption =
  | 'DD/MM/YYYY'
  | 'MM/DD/YYYY'
  | 'YYYY-MM-DD'
  | 'DD MMM YYYY'
  | 'MMMM DD, YYYY';

/**
 * Complete generation configuration
 */
export interface GenerationConfig {
  // Company info (appears on invoice)
  company: CompanyInfo;

  // Invoice settings
  template: InvoiceTemplate;
  currency: string;
  currencySymbol: string;
  currencyPosition: CurrencyPosition;

  // Formatting
  dateFormat: DateFormatOption;
  numberFormat: NumberFormat;

  // Visibility
  showFields: FieldVisibility;

  // Bank details (optional)
  bankDetails?: BankDetails;

  // Footer
  footerText?: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: GenerationConfig = {
  company: {
    name: '',
  },
  template: 'professional',
  currency: 'USD',
  currencySymbol: '$',
  currencyPosition: 'before',
  dateFormat: 'MM/DD/YYYY',
  numberFormat: {
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  showFields: {
    customerAddress: true,
    customerEmail: false,
    customerPhone: false,
    dueDate: true,
    poNumber: false,
    taxBreakdown: true,
    taxId: false,
    notes: true,
    terms: true,
    bankDetails: false,
  },
};
