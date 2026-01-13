import type { Invoice, GenerationConfig } from '@excel-to-invoice/shared';
import { formatCurrency, formatDate, formatNumber } from '@excel-to-invoice/shared';

/**
 * Render invoice to HTML string
 */
export function renderTemplate(
  invoice: Invoice,
  config: GenerationConfig
): string {
  switch (config.template) {
    case 'simple':
      return renderSimpleTemplate(invoice, config);
    case 'simple-logo':
      return renderSimpleLogoTemplate(invoice, config);
    case 'professional':
      return renderProfessionalTemplate(invoice, config);
    case 'tax-invoice':
      return renderTaxInvoiceTemplate(invoice, config);
    default:
      return renderProfessionalTemplate(invoice, config);
  }
}

/**
 * Format currency value using config
 */
function formatMoney(value: number, config: GenerationConfig): string {
  return formatCurrency(
    value,
    config.currencySymbol,
    config.currencyPosition,
    config.numberFormat
  );
}

/**
 * Common styles for all templates
 */
const commonStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 12px;
    line-height: 1.5;
    color: #333;
  }
  .invoice {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    padding: 8px 12px;
    text-align: left;
  }
  .text-right {
    text-align: right;
  }
  .text-center {
    text-align: center;
  }
`;

/**
 * Simple template
 */
function renderSimpleTemplate(invoice: Invoice, config: GenerationConfig): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${commonStyles}
    .header {
      margin-bottom: 30px;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .invoice-title {
      font-size: 20px;
      color: #666;
      margin-bottom: 20px;
    }
    .details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .details-section {
      width: 48%;
    }
    .details-section h3 {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .items-table {
      margin-bottom: 30px;
    }
    .items-table th {
      background: #f5f5f5;
      border-bottom: 2px solid #ddd;
      font-weight: 600;
    }
    .items-table td {
      border-bottom: 1px solid #eee;
    }
    .totals {
      width: 300px;
      margin-left: auto;
    }
    .totals tr:last-child {
      font-weight: bold;
      font-size: 14px;
    }
    .totals tr:last-child td {
      padding-top: 10px;
      border-top: 2px solid #333;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 11px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="company-name">${escapeHtml(config.company.name)}</div>
      ${config.company.address ? `<div>${escapeHtml(config.company.address)}</div>` : ''}
      ${config.company.phone ? `<div>Phone: ${escapeHtml(config.company.phone)}</div>` : ''}
      ${config.company.email ? `<div>Email: ${escapeHtml(config.company.email)}</div>` : ''}
    </div>

    <div class="invoice-title">INVOICE</div>

    <div class="details">
      <div class="details-section">
        <h3>Bill To</h3>
        <div><strong>${escapeHtml(invoice.customer.name)}</strong></div>
        ${config.showFields.customerAddress && invoice.customer.address?.line1 ? `<div>${escapeHtml(invoice.customer.address.line1)}</div>` : ''}
        ${config.showFields.customerEmail && invoice.customer.email ? `<div>${escapeHtml(invoice.customer.email)}</div>` : ''}
        ${config.showFields.customerPhone && invoice.customer.phone ? `<div>${escapeHtml(invoice.customer.phone)}</div>` : ''}
      </div>
      <div class="details-section">
        <table>
          <tr>
            <td><strong>Invoice #:</strong></td>
            <td class="text-right">${escapeHtml(invoice.invoiceNumber)}</td>
          </tr>
          <tr>
            <td><strong>Date:</strong></td>
            <td class="text-right">${formatDate(invoice.issueDate, config.dateFormat)}</td>
          </tr>
          ${config.showFields.dueDate && invoice.dueDate ? `
          <tr>
            <td><strong>Due Date:</strong></td>
            <td class="text-right">${formatDate(invoice.dueDate, config.dateFormat)}</td>
          </tr>
          ` : ''}
          ${config.showFields.poNumber && invoice.poNumber ? `
          <tr>
            <td><strong>PO #:</strong></td>
            <td class="text-right">${escapeHtml(invoice.poNumber)}</td>
          </tr>
          ` : ''}
        </table>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit Price</th>
          ${config.showFields.taxBreakdown ? '<th class="text-right">Tax</th>' : ''}
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.lineItems.map(item => `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td class="text-right">${formatNumber(item.quantity, config.numberFormat)}</td>
          <td class="text-right">${formatMoney(item.unitPrice, config)}</td>
          ${config.showFields.taxBreakdown ? `<td class="text-right">${item.taxRate ? item.taxRate + '%' : '-'}</td>` : ''}
          <td class="text-right">${formatMoney(item.lineTotal, config)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <table class="totals">
      <tr>
        <td>Subtotal:</td>
        <td class="text-right">${formatMoney(invoice.subtotal, config)}</td>
      </tr>
      ${invoice.totalDiscount > 0 ? `
      <tr>
        <td>Discount:</td>
        <td class="text-right">-${formatMoney(invoice.totalDiscount, config)}</td>
      </tr>
      ` : ''}
      ${config.showFields.taxBreakdown && invoice.totalTax > 0 ? `
      <tr>
        <td>Tax:</td>
        <td class="text-right">${formatMoney(invoice.totalTax, config)}</td>
      </tr>
      ` : ''}
      <tr>
        <td>Total:</td>
        <td class="text-right">${formatMoney(invoice.grandTotal, config)}</td>
      </tr>
    </table>

    ${config.showFields.notes && invoice.notes ? `
    <div class="footer">
      <strong>Notes:</strong><br>
      ${escapeHtml(invoice.notes)}
    </div>
    ` : ''}

    ${config.showFields.bankDetails && config.bankDetails ? `
    <div class="footer">
      <strong>Payment Details:</strong><br>
      Bank: ${escapeHtml(config.bankDetails.bankName)}<br>
      Account: ${escapeHtml(config.bankDetails.accountNumber)}<br>
      ${config.bankDetails.swift ? `SWIFT: ${escapeHtml(config.bankDetails.swift)}<br>` : ''}
    </div>
    ` : ''}

    ${config.footerText ? `
    <div class="footer">
      ${escapeHtml(config.footerText)}
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
}

/**
 * Simple + Logo template
 */
function renderSimpleLogoTemplate(invoice: Invoice, config: GenerationConfig): string {
  const simple = renderSimpleTemplate(invoice, config);

  if (!config.company.logo) {
    return simple;
  }

  // Inject logo into header
  const logoHtml = `<img src="${config.company.logo}" style="max-height: 60px; max-width: 200px; margin-bottom: 10px;" />`;

  return simple.replace(
    '<div class="company-name">',
    `${logoHtml}<div class="company-name">`
  );
}

/**
 * Professional template
 */
function renderProfessionalTemplate(invoice: Invoice, config: GenerationConfig): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${commonStyles}
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      margin: -20px -20px 30px -20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .logo {
      max-height: 50px;
      max-width: 150px;
    }
    .company-name {
      font-size: 20px;
      font-weight: bold;
    }
    .invoice-badge {
      background: rgba(255,255,255,0.2);
      padding: 10px 20px;
      border-radius: 5px;
    }
    .invoice-number {
      font-size: 18px;
      font-weight: bold;
    }
    .details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .details-section {
      width: 48%;
    }
    .details-section h3 {
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .items-table {
      margin-bottom: 30px;
    }
    .items-table th {
      background: #f8f9fa;
      color: #667eea;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
      padding: 12px;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
    }
    .items-table tr:nth-child(even) td {
      background: #fafafa;
    }
    .totals-container {
      display: flex;
      justify-content: flex-end;
    }
    .totals {
      width: 300px;
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
    }
    .totals tr td {
      padding: 8px 0;
    }
    .totals tr:last-child {
      font-weight: bold;
      font-size: 16px;
      color: #667eea;
    }
    .totals tr:last-child td {
      padding-top: 15px;
      border-top: 2px solid #667eea;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 11px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="header-left">
        ${config.company.logo ? `<img class="logo" src="${config.company.logo}" />` : ''}
        <div>
          <div class="company-name">${escapeHtml(config.company.name)}</div>
          ${config.company.website ? `<div style="opacity: 0.8; font-size: 11px;">${escapeHtml(config.company.website)}</div>` : ''}
        </div>
      </div>
      <div class="invoice-badge">
        <div style="font-size: 11px; opacity: 0.8;">INVOICE</div>
        <div class="invoice-number">#${escapeHtml(invoice.invoiceNumber)}</div>
      </div>
    </div>

    <div class="details">
      <div class="details-section">
        <h3>Billed To</h3>
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 5px;">${escapeHtml(invoice.customer.name)}</div>
        ${config.showFields.customerAddress && invoice.customer.address?.line1 ? `<div>${escapeHtml(invoice.customer.address.line1)}</div>` : ''}
        ${config.showFields.customerEmail && invoice.customer.email ? `<div>${escapeHtml(invoice.customer.email)}</div>` : ''}
        ${config.showFields.customerPhone && invoice.customer.phone ? `<div>${escapeHtml(invoice.customer.phone)}</div>` : ''}
      </div>
      <div class="details-section" style="text-align: right;">
        <h3>Invoice Details</h3>
        <div><strong>Date:</strong> ${formatDate(invoice.issueDate, config.dateFormat)}</div>
        ${config.showFields.dueDate && invoice.dueDate ? `<div><strong>Due:</strong> ${formatDate(invoice.dueDate, config.dateFormat)}</div>` : ''}
        ${config.showFields.poNumber && invoice.poNumber ? `<div><strong>PO:</strong> ${escapeHtml(invoice.poNumber)}</div>` : ''}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Rate</th>
          ${config.showFields.taxBreakdown ? '<th class="text-right">Tax</th>' : ''}
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.lineItems.map(item => `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td class="text-center">${formatNumber(item.quantity, config.numberFormat)}</td>
          <td class="text-right">${formatMoney(item.unitPrice, config)}</td>
          ${config.showFields.taxBreakdown ? `<td class="text-right">${item.taxRate ? item.taxRate + '%' : '-'}</td>` : ''}
          <td class="text-right">${formatMoney(item.lineTotal, config)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-container">
      <table class="totals">
        <tr>
          <td>Subtotal</td>
          <td class="text-right">${formatMoney(invoice.subtotal, config)}</td>
        </tr>
        ${invoice.totalDiscount > 0 ? `
        <tr>
          <td>Discount</td>
          <td class="text-right">-${formatMoney(invoice.totalDiscount, config)}</td>
        </tr>
        ` : ''}
        ${config.showFields.taxBreakdown && invoice.totalTax > 0 ? `
        <tr>
          <td>Tax</td>
          <td class="text-right">${formatMoney(invoice.totalTax, config)}</td>
        </tr>
        ` : ''}
        <tr>
          <td>Total Due</td>
          <td class="text-right">${formatMoney(invoice.grandTotal, config)}</td>
        </tr>
      </table>
    </div>

    ${config.showFields.notes && invoice.notes ? `
    <div class="footer">
      <strong>Notes</strong><br>
      ${escapeHtml(invoice.notes)}
    </div>
    ` : ''}

    ${config.showFields.bankDetails && config.bankDetails ? `
    <div class="footer">
      <strong>Payment Information</strong><br>
      Bank: ${escapeHtml(config.bankDetails.bankName)} |
      Account: ${escapeHtml(config.bankDetails.accountNumber)}
      ${config.bankDetails.swift ? ` | SWIFT: ${escapeHtml(config.bankDetails.swift)}` : ''}
    </div>
    ` : ''}

    ${config.footerText ? `
    <div class="footer" style="text-align: center;">
      ${escapeHtml(config.footerText)}
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
}

/**
 * Tax Invoice template
 */
function renderTaxInvoiceTemplate(invoice: Invoice, config: GenerationConfig): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${commonStyles}
    .tax-header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 2px solid #333;
    }
    .tax-title {
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 3px;
    }
    .company-section {
      text-align: center;
      margin-bottom: 20px;
    }
    .company-name {
      font-size: 20px;
      font-weight: bold;
    }
    .tax-id {
      font-size: 12px;
      color: #666;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 15px;
      background: #f9f9f9;
    }
    .party {
      width: 48%;
    }
    .party-title {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 11px;
      color: #666;
      margin-bottom: 5px;
    }
    .invoice-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .meta-item {
      text-align: center;
      padding: 10px 20px;
      border: 1px solid #ddd;
    }
    .meta-label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
    }
    .meta-value {
      font-weight: bold;
      font-size: 14px;
    }
    .items-table th {
      background: #333;
      color: white;
      font-size: 11px;
      padding: 10px;
    }
    .items-table td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    .tax-summary {
      margin-top: 20px;
      padding: 15px;
      background: #f9f9f9;
    }
    .totals {
      width: 350px;
      margin-left: auto;
      margin-top: 20px;
    }
    .totals td {
      padding: 8px;
      border-bottom: 1px solid #eee;
    }
    .totals tr:last-child {
      font-weight: bold;
      font-size: 16px;
    }
    .totals tr:last-child td {
      border-top: 2px solid #333;
      border-bottom: none;
      padding-top: 15px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="tax-header">
      <div class="tax-title">TAX INVOICE</div>
    </div>

    <div class="company-section">
      ${config.company.logo ? `<img src="${config.company.logo}" style="max-height: 50px; margin-bottom: 10px;" />` : ''}
      <div class="company-name">${escapeHtml(config.company.name)}</div>
      ${config.company.address ? `<div>${escapeHtml(config.company.address)}</div>` : ''}
      ${config.showFields.taxId && config.company.taxId ? `<div class="tax-id">Tax ID: ${escapeHtml(config.company.taxId)}</div>` : ''}
    </div>

    <div class="invoice-meta">
      <div class="meta-item">
        <div class="meta-label">Invoice Number</div>
        <div class="meta-value">${escapeHtml(invoice.invoiceNumber)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Invoice Date</div>
        <div class="meta-value">${formatDate(invoice.issueDate, config.dateFormat)}</div>
      </div>
      ${config.showFields.dueDate && invoice.dueDate ? `
      <div class="meta-item">
        <div class="meta-label">Due Date</div>
        <div class="meta-value">${formatDate(invoice.dueDate, config.dateFormat)}</div>
      </div>
      ` : ''}
    </div>

    <div class="parties">
      <div class="party">
        <div class="party-title">From</div>
        <div><strong>${escapeHtml(config.company.name)}</strong></div>
        ${config.company.address ? `<div>${escapeHtml(config.company.address)}</div>` : ''}
        ${config.company.phone ? `<div>Tel: ${escapeHtml(config.company.phone)}</div>` : ''}
      </div>
      <div class="party">
        <div class="party-title">Bill To</div>
        <div><strong>${escapeHtml(invoice.customer.name)}</strong></div>
        ${config.showFields.customerAddress && invoice.customer.address?.line1 ? `<div>${escapeHtml(invoice.customer.address.line1)}</div>` : ''}
        ${config.showFields.taxId && invoice.customer.taxId ? `<div>Tax ID: ${escapeHtml(invoice.customer.taxId)}</div>` : ''}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Tax Rate</th>
          <th class="text-right">Tax Amount</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.lineItems.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.description)}${item.hsnCode ? `<br><small>HSN: ${item.hsnCode}</small>` : ''}</td>
          <td class="text-center">${formatNumber(item.quantity, config.numberFormat)}</td>
          <td class="text-right">${formatMoney(item.unitPrice, config)}</td>
          <td class="text-right">${item.taxRate ? item.taxRate + '%' : '0%'}</td>
          <td class="text-right">${formatMoney(item.taxAmount ?? 0, config)}</td>
          <td class="text-right">${formatMoney(item.lineTotal + (item.taxAmount ?? 0), config)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="tax-summary">
      <strong>Tax Summary</strong>
      <table style="margin-top: 10px;">
        <tr>
          <td>Taxable Amount:</td>
          <td class="text-right">${formatMoney(invoice.subtotal, config)}</td>
        </tr>
        <tr>
          <td>Total Tax:</td>
          <td class="text-right">${formatMoney(invoice.totalTax, config)}</td>
        </tr>
      </table>
    </div>

    <table class="totals">
      <tr>
        <td>Subtotal:</td>
        <td class="text-right">${formatMoney(invoice.subtotal, config)}</td>
      </tr>
      ${invoice.totalDiscount > 0 ? `
      <tr>
        <td>Discount:</td>
        <td class="text-right">-${formatMoney(invoice.totalDiscount, config)}</td>
      </tr>
      ` : ''}
      <tr>
        <td>Tax:</td>
        <td class="text-right">${formatMoney(invoice.totalTax, config)}</td>
      </tr>
      <tr>
        <td>Grand Total:</td>
        <td class="text-right">${formatMoney(invoice.grandTotal, config)}</td>
      </tr>
    </table>

    ${config.showFields.bankDetails && config.bankDetails ? `
    <div class="footer">
      <strong>Bank Details for Payment:</strong><br>
      Bank: ${escapeHtml(config.bankDetails.bankName)} |
      Account Name: ${escapeHtml(config.bankDetails.accountName)} |
      Account No: ${escapeHtml(config.bankDetails.accountNumber)}
      ${config.bankDetails.swift ? ` | SWIFT: ${escapeHtml(config.bankDetails.swift)}` : ''}
      ${config.bankDetails.iban ? ` | IBAN: ${escapeHtml(config.bankDetails.iban)}` : ''}
    </div>
    ` : ''}

    ${config.footerText ? `
    <div class="footer">
      ${escapeHtml(config.footerText)}
    </div>
    ` : ''}

    <div class="footer" style="text-align: center; margin-top: 30px;">
      This is a computer-generated invoice. No signature required.
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
