import type { ColumnMapping, Invoice, Customer, InvoiceLineItem, Address } from '@excel-to-invoice/shared';
import { generateId, parseDate } from '@excel-to-invoice/shared';
import { readSheetData, detectHeaders } from './excelParser.js';
import { detectColumnMappings, detectSheetRelationships, type ExcelFormat, type SheetRelationship } from '../mapper/columnMapper.js';

/**
 * Transform Excel data to Invoice objects using column mappings
 */
export async function transformToInvoices(
  filePath: string,
  mappings: ColumnMapping[],
  format: ExcelFormat,
  selectedSheets?: string[]
): Promise<{ invoices: Invoice[]; warnings: string[] }> {
  const warnings: string[] = [];

  if (format === 'multi_sheet' && selectedSheets && selectedSheets.length >= 2) {
    return transformMultiSheet(filePath, selectedSheets, mappings, warnings);
  }

  // Single sheet mode (flat_single_row or flat_multi_row)
  const data = await readSheetData(filePath, selectedSheets?.[0]);

  // Create mapping lookup
  const fieldMap = createFieldMap(mappings);

  // Group rows by invoice number (for multi-row invoices)
  const invoiceGroups = groupByInvoiceNumber(data, fieldMap);

  // Convert groups to Invoice objects
  const invoices: Invoice[] = [];

  for (const [invoiceNumber, rows] of invoiceGroups) {
    try {
      const invoice = createInvoice(invoiceNumber, rows, fieldMap);
      invoices.push(invoice);
    } catch (error) {
      warnings.push(`Failed to process invoice ${invoiceNumber}: ${(error as Error).message}`);
    }
  }

  return { invoices, warnings };
}

/**
 * Create field mapping lookup from column mappings
 */
function createFieldMap(mappings: ColumnMapping[]): Map<string, string> {
  const fieldMap = new Map<string, string>();
  for (const mapping of mappings) {
    if (mapping.targetField) {
      fieldMap.set(mapping.targetField, mapping.sourceColumn);
    }
  }
  return fieldMap;
}

/**
 * Transform multi-sheet relational Excel to invoices
 */
async function transformMultiSheet(
  filePath: string,
  sheets: string[],
  userMappings: ColumnMapping[],
  warnings: string[]
): Promise<{ invoices: Invoice[]; warnings: string[] }> {
  // Load all sheets
  const sheetData = new Map<string, { headers: string[]; data: Record<string, unknown>[] }>();

  for (const sheetName of sheets) {
    const data = await readSheetData(filePath, sheetName);
    const headers = detectHeaders(data);
    sheetData.set(sheetName, { headers, data });
  }

  // Detect relationships between sheets (for potential future use)
  const _relationships = detectSheetRelationships(sheetData);
  void _relationships; // Prevent unused variable warning

  // Identify sheet types by name patterns
  const sheetTypes = identifySheetTypes(sheets);

  if (!sheetTypes.invoices) {
    warnings.push('No invoice sheet detected. Using first sheet as invoice data.');
    sheetTypes.invoices = sheets[0];
  }

  // Build mappings for each sheet
  // First, use user-provided mappings if available
  const sheetMappings = new Map<string, Map<string, string>>();

  // Convert user mappings to field maps - check if mappings have sheetName
  const userMappingsBySheet = new Map<string, ColumnMapping[]>();
  for (const mapping of userMappings) {
    // Mappings may have sheetName attached, or apply to all sheets
    const sheetName = (mapping as unknown as { sheetName?: string }).sheetName;
    if (sheetName) {
      if (!userMappingsBySheet.has(sheetName)) {
        userMappingsBySheet.set(sheetName, []);
      }
      userMappingsBySheet.get(sheetName)?.push(mapping);
    }
  }

  // For each sheet, use user mappings if available, otherwise auto-detect
  for (const [sheetName, { headers, data }] of sheetData) {
    const sheetUserMappings = userMappingsBySheet.get(sheetName);
    if (sheetUserMappings && sheetUserMappings.length > 0) {
      // Use user-provided mappings for this sheet
      sheetMappings.set(sheetName, createFieldMap(sheetUserMappings));
    } else {
      // No user mappings for this sheet, auto-detect
      const autoMappings = detectColumnMappings(headers, data);
      sheetMappings.set(sheetName, createFieldMap(autoMappings));
    }
  }

  // Build customer lookup if customer sheet exists
  // Use normalized string keys for robust matching
  const customerLookup = new Map<string, Customer>();
  if (sheetTypes.customers) {
    const customerData = sheetData.get(sheetTypes.customers);
    const customerFieldMap = sheetMappings.get(sheetTypes.customers);

    if (customerData && customerFieldMap) {
      for (const row of customerData.data) {
        const customerId = getFieldValue(row, customerFieldMap, 'customerId') || generateId();
        const customer = extractCustomer(row, customerFieldMap);
        customer.id = customerId;
        // Store with normalized key (trimmed, lowercase) for robust matching
        const normalizedId = String(customerId).trim().toLowerCase();
        customerLookup.set(normalizedId, customer);
        // Also store with original key for exact matches
        customerLookup.set(String(customerId).trim(), customer);
      }
    }
  }

  // Build line items lookup if items sheet exists
  // Use normalized string keys for robust matching
  const itemsLookup = new Map<string, InvoiceLineItem[]>();
  if (sheetTypes.items) {
    const itemsData = sheetData.get(sheetTypes.items);
    const itemsFieldMap = sheetMappings.get(sheetTypes.items);

    if (itemsData && itemsFieldMap) {
      for (const row of itemsData.data) {
        const invoiceId = getFieldValue(row, itemsFieldMap, 'invoiceId')
          || getFieldValue(row, itemsFieldMap, 'invoiceNumber');

        if (invoiceId) {
          // Use normalized key for robust matching
          const normalizedId = String(invoiceId).trim().toLowerCase();
          if (!itemsLookup.has(normalizedId)) {
            itemsLookup.set(normalizedId, []);
          }
          itemsLookup.get(normalizedId)?.push(extractLineItem(row, itemsFieldMap));
        }
      }
    }
  }

  // Build invoices from invoice sheet
  const invoices: Invoice[] = [];
  const invoiceData = sheetData.get(sheetTypes.invoices!);
  const invoiceFieldMap = sheetMappings.get(sheetTypes.invoices!);

  if (invoiceData && invoiceFieldMap) {
    for (let i = 0; i < invoiceData.data.length; i++) {
      const row = invoiceData.data[i];
      if (!row) continue;

      try {
        const invoiceNumber = getFieldValue(row, invoiceFieldMap, 'invoiceNumber')
          || `AUTO-${i + 1}`;
        const invoiceId = getFieldValue(row, invoiceFieldMap, 'invoiceId') || invoiceNumber;

        // Get customer - try customer ID first, then inline customer data
        const customerId = getFieldValue(row, invoiceFieldMap, 'customerId');
        let customer: Customer | undefined;

        if (customerId) {
          // Try normalized lookup first, then exact match
          const normalizedId = String(customerId).trim().toLowerCase();
          customer = customerLookup.get(normalizedId) || customerLookup.get(String(customerId).trim());
        }

        if (!customer) {
          // Fallback: try to extract customer from invoice row (for inline data)
          customer = extractCustomer(row, invoiceFieldMap);

          // If still no name, the customer data is in another sheet - this is expected for multi-sheet
          // Only warn if customerLookup exists but we couldn't find the customer
          if (customer.name === 'Unknown Customer' && customerId && customerLookup.size > 0) {
            warnings.push(`Invoice ${invoiceNumber}: Customer ID "${customerId}" not found in customers sheet.`);
          }
        }

        // Get line items - try items lookup first, then inline item data
        const normalizedInvoiceId = String(invoiceId).trim().toLowerCase();
        const normalizedInvoiceNumber = String(invoiceNumber).trim().toLowerCase();
        let lineItems = itemsLookup.get(normalizedInvoiceId) || itemsLookup.get(normalizedInvoiceNumber);

        if (!lineItems || lineItems.length === 0) {
          // Try to extract inline line item
          const description = getFieldValue(row, invoiceFieldMap, 'description');
          if (description) {
            lineItems = [extractLineItem(row, invoiceFieldMap)];
          } else {
            lineItems = [{
              description: 'Item',
              quantity: 1,
              unitPrice: 0,
              lineTotal: 0,
            }];
            warnings.push(`Invoice ${invoiceNumber} has no line items.`);
          }
        }

        // Calculate totals
        const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
        const totalTax = lineItems.reduce((sum, item) => sum + (item.taxAmount ?? 0), 0);
        const totalDiscount = calculateTotalDiscount(lineItems);

        // Get explicit grand total or calculate it
        const explicitTotal = parseFloat(getFieldValue(row, invoiceFieldMap, 'invoiceTotal') || '0');
        const grandTotal = explicitTotal > 0 ? explicitTotal : subtotal - totalDiscount + totalTax;

        // Parse dates
        const issueDateValue = getFieldValue(row, invoiceFieldMap, 'issueDate');
        const dueDateValue = getFieldValue(row, invoiceFieldMap, 'dueDate');
        const issueDate = parseDate(issueDateValue) ?? new Date();
        const dueDate = dueDateValue ? parseDate(dueDateValue) ?? undefined : undefined;

        // Get currency
        const currency = getFieldValue(row, invoiceFieldMap, 'currency') || 'USD';

        const invoice: Invoice = {
          invoiceNumber,
          customer,
          issueDate,
          dueDate,
          lineItems,
          currency,
          subtotal,
          totalTax,
          totalDiscount,
          grandTotal,
          amountPaid: parseFloat(getFieldValue(row, invoiceFieldMap, 'amountPaid') || '0') || undefined,
          notes: getFieldValue(row, invoiceFieldMap, 'notes') || undefined,
          terms: getFieldValue(row, invoiceFieldMap, 'terms') || undefined,
          poNumber: getFieldValue(row, invoiceFieldMap, 'poNumber') || undefined,
          status: 'valid',
          rowNumbers: [i + 2],
        };

        invoices.push(invoice);
      } catch (error) {
        warnings.push(`Failed to process row ${i + 2}: ${(error as Error).message}`);
      }
    }
  }

  return { invoices, warnings };
}

/**
 * Identify sheet types from sheet names
 */
function identifySheetTypes(sheets: string[]): {
  customers?: string;
  invoices?: string;
  items?: string;
} {
  const result: { customers?: string; invoices?: string; items?: string } = {};

  for (const sheet of sheets) {
    const lower = sheet.toLowerCase();

    if (!result.customers && (lower.includes('customer') || lower.includes('client') || lower.includes('contact'))) {
      result.customers = sheet;
    } else if (!result.items && (lower.includes('item') || lower.includes('line') || lower.includes('detail'))) {
      result.items = sheet;
    } else if (!result.invoices && (lower.includes('invoice') || lower.includes('bill') || lower.includes('header') || lower.includes('order'))) {
      result.invoices = sheet;
    }
  }

  // If invoice sheet not found, use first sheet that's not customers or items
  if (!result.invoices) {
    for (const sheet of sheets) {
      if (sheet !== result.customers && sheet !== result.items) {
        result.invoices = sheet;
        break;
      }
    }
  }

  return result;
}

/**
 * Group rows by invoice number
 */
function groupByInvoiceNumber(
  data: Record<string, unknown>[],
  fieldMap: Map<string, string>
): Map<string, Array<{ row: Record<string, unknown>; rowNumber: number }>> {
  const groups = new Map<string, Array<{ row: Record<string, unknown>; rowNumber: number }>>();
  const invoiceNumberCol = fieldMap.get('invoiceNumber');

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    // Skip completely empty rows
    const hasData = Object.values(row).some(v => v !== undefined && v !== null && v !== '');
    if (!hasData) continue;

    const invoiceNumber = invoiceNumberCol
      ? String(row[invoiceNumberCol] ?? `AUTO-${i + 1}`)
      : `AUTO-${i + 1}`;

    if (!groups.has(invoiceNumber)) {
      groups.set(invoiceNumber, []);
    }

    groups.get(invoiceNumber)?.push({ row, rowNumber: i + 2 }); // +2 for 1-based + header
  }

  return groups;
}

/**
 * Create an Invoice from grouped rows
 */
function createInvoice(
  invoiceNumber: string,
  rows: Array<{ row: Record<string, unknown>; rowNumber: number }>,
  fieldMap: Map<string, string>
): Invoice {
  const firstRow = rows[0]?.row ?? {};
  const rowNumbers = rows.map((r) => r.rowNumber);

  // Extract customer from first row
  const customer = extractCustomer(firstRow, fieldMap);

  // Extract line items from all rows
  const lineItems = rows.map((r) => extractLineItem(r.row, fieldMap));

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalTax = lineItems.reduce((sum, item) => sum + (item.taxAmount ?? 0), 0);
  const totalDiscount = calculateTotalDiscount(lineItems);

  // Parse dates
  const issueDateValue = getFieldValue(firstRow, fieldMap, 'issueDate');
  const dueDateValue = getFieldValue(firstRow, fieldMap, 'dueDate');

  const issueDate = parseDate(issueDateValue) ?? new Date();
  const dueDate = dueDateValue ? parseDate(dueDateValue) ?? undefined : undefined;

  // Get currency
  const currency = getFieldValue(firstRow, fieldMap, 'currency') || 'USD';

  // Get explicit totals or calculate
  const explicitSubtotal = parseFloat(getFieldValue(firstRow, fieldMap, 'invoiceSubtotal') || '0');
  const explicitTax = parseFloat(getFieldValue(firstRow, fieldMap, 'invoiceTax') || '0');
  const explicitTotal = parseFloat(getFieldValue(firstRow, fieldMap, 'invoiceTotal') || '0');

  const finalSubtotal = explicitSubtotal > 0 ? explicitSubtotal : subtotal;
  const finalTax = explicitTax > 0 ? explicitTax : totalTax;
  const grandTotal = explicitTotal > 0 ? explicitTotal : finalSubtotal - totalDiscount + finalTax;

  const invoice: Invoice = {
    invoiceNumber,
    customer,
    issueDate,
    dueDate,
    lineItems,
    currency,
    subtotal: finalSubtotal,
    totalTax: finalTax,
    totalDiscount,
    grandTotal,
    amountPaid: parseFloat(getFieldValue(firstRow, fieldMap, 'amountPaid') || '0') || undefined,
    notes: getFieldValue(firstRow, fieldMap, 'notes') || undefined,
    terms: getFieldValue(firstRow, fieldMap, 'terms') || undefined,
    poNumber: getFieldValue(firstRow, fieldMap, 'poNumber') || undefined,
    status: 'valid',
    rowNumbers,
  };

  return invoice;
}

/**
 * Calculate total discount from line items
 */
function calculateTotalDiscount(lineItems: InvoiceLineItem[]): number {
  return lineItems.reduce((sum, item) => {
    if (!item.discount) return sum;
    if (item.discount.type === 'fixed') return sum + item.discount.value;
    return sum + (item.unitPrice * item.quantity * item.discount.value / 100);
  }, 0);
}

/**
 * Extract customer from row data with full address support
 */
function extractCustomer(
  row: Record<string, unknown>,
  fieldMap: Map<string, string>
): Customer {
  // Build address from individual fields or single address field
  let address: Address | undefined;

  const addressLine1 = getFieldValue(row, fieldMap, 'customerAddress');
  const city = getFieldValue(row, fieldMap, 'customerCity');
  const state = getFieldValue(row, fieldMap, 'customerState');
  const postalCode = getFieldValue(row, fieldMap, 'customerPostalCode');
  const country = getFieldValue(row, fieldMap, 'customerCountry');

  if (addressLine1 || city || state || postalCode || country) {
    address = {
      line1: addressLine1 || undefined,
      city: city || undefined,
      state: state || undefined,
      postalCode: postalCode || undefined,
      country: country || undefined,
    };
  }

  return {
    id: getFieldValue(row, fieldMap, 'customerId') || generateId(),
    name: getFieldValue(row, fieldMap, 'customerName') || 'Unknown Customer',
    email: getFieldValue(row, fieldMap, 'customerEmail') || undefined,
    phone: getFieldValue(row, fieldMap, 'customerPhone') || undefined,
    address,
    taxId: getFieldValue(row, fieldMap, 'customerTaxId') || undefined,
  };
}

/**
 * Extract line item from row data
 */
function extractLineItem(
  row: Record<string, unknown>,
  fieldMap: Map<string, string>
): InvoiceLineItem {
  const quantity = parseFloat(getFieldValue(row, fieldMap, 'quantity') || '1') || 1;
  const unitPrice = parseFloat(getFieldValue(row, fieldMap, 'unitPrice') || '0') || 0;
  const taxRate = parseFloat(getFieldValue(row, fieldMap, 'taxRate') || '0') || 0;
  const discountValue = parseFloat(getFieldValue(row, fieldMap, 'discount') || '0') || 0;

  // Try to get explicit line total, or calculate it
  let lineTotal = parseFloat(getFieldValue(row, fieldMap, 'lineTotal') || '0');

  if (lineTotal === 0) {
    lineTotal = quantity * unitPrice;
  }

  // Calculate or get explicit tax amount
  const explicitTaxAmount = parseFloat(getFieldValue(row, fieldMap, 'taxAmount') || '0');
  const taxAmount = explicitTaxAmount > 0 ? explicitTaxAmount : (taxRate > 0 ? lineTotal * (taxRate / 100) : 0);

  // Get SKU if available
  const sku = getFieldValue(row, fieldMap, 'sku');

  return {
    description: getFieldValue(row, fieldMap, 'description') || 'Item',
    quantity,
    unitPrice,
    discount: discountValue > 0
      ? {
          type: discountValue > 100 ? 'fixed' : 'percentage',
          value: discountValue
        }
      : undefined,
    taxRate: taxRate > 0 ? taxRate : undefined,
    taxAmount: taxAmount > 0 ? taxAmount : undefined,
    lineTotal,
    sku: sku || undefined,
  };
}

/**
 * Get field value from row using mapping
 */
function getFieldValue(
  row: Record<string, unknown>,
  fieldMap: Map<string, string>,
  field: string
): string {
  const column = fieldMap.get(field);

  if (!column) return '';

  const value = row[column];

  if (value === undefined || value === null) return '';

  // Handle dates that might be serialized as numbers (Excel date serial)
  if (typeof value === 'number' && field.toLowerCase().includes('date')) {
    // Excel serial date to JS Date
    const date = new Date((value - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return String(value).trim();
}

/**
 * Merge data from multiple sheets using relationships
 */
export function mergeSheetData(
  sheetData: Map<string, { headers: string[]; data: Record<string, unknown>[] }>,
  relationships: SheetRelationship[]
): Record<string, unknown>[] {
  // Find the main sheet (typically invoices or the one with most outgoing relationships)
  const outgoingCounts = new Map<string, number>();
  for (const rel of relationships) {
    outgoingCounts.set(rel.fromSheet, (outgoingCounts.get(rel.fromSheet) ?? 0) + 1);
  }

  let mainSheet = '';
  let maxCount = 0;
  for (const [sheet, count] of outgoingCounts) {
    if (count > maxCount) {
      maxCount = count;
      mainSheet = sheet;
    }
  }

  // If no relationships, return first sheet's data
  if (!mainSheet && sheetData.size > 0) {
    const firstSheet = Array.from(sheetData.values())[0];
    return firstSheet?.data ?? [];
  }

  // Build lookup maps for related sheets
  const lookups = new Map<string, Map<string, Record<string, unknown>>>();

  for (const rel of relationships) {
    if (rel.fromSheet === mainSheet) {
      const toSheetData = sheetData.get(rel.toSheet);
      if (toSheetData) {
        if (!lookups.has(rel.toSheet)) {
          lookups.set(rel.toSheet, new Map());
        }
        const lookup = lookups.get(rel.toSheet)!;
        for (const row of toSheetData.data) {
          const key = String(row[rel.toColumn] ?? '');
          if (key) {
            lookup.set(key, row);
          }
        }
      }
    }
  }

  // Merge main sheet with related data
  const mainData = sheetData.get(mainSheet)?.data ?? [];
  const mergedData: Record<string, unknown>[] = [];

  for (const row of mainData) {
    const mergedRow = { ...row };

    for (const rel of relationships) {
      if (rel.fromSheet === mainSheet) {
        const lookup = lookups.get(rel.toSheet);
        if (lookup) {
          const key = String(row[rel.fromColumn] ?? '');
          const relatedRow = lookup.get(key);
          if (relatedRow) {
            // Merge related data with prefix to avoid conflicts
            for (const [col, val] of Object.entries(relatedRow)) {
              if (!(col in mergedRow)) {
                mergedRow[col] = val;
              }
            }
          }
        }
      }
    }

    mergedData.push(mergedRow);
  }

  return mergedData;
}
