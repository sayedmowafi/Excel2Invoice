/**
 * Customer data structure
 * Represents a customer/client who receives invoices
 */
export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Customer {
  /** Unique identifier - generated or from Excel */
  id: string;
  /** Customer/Company name - Required */
  name: string;
  /** Email address for invoice delivery */
  email?: string;
  /** Phone number */
  phone?: string;
  /** Full address */
  address?: Address;
  /** Tax identification number (VAT/GST/EIN) */
  taxId?: string;
}

export type CustomerInput = Omit<Customer, 'id'> & { id?: string };
