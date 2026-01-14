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
 * Common styles for all templates - Full page A4
 */
const commonStyles = `
  @page {
    size: A4;
    margin: 0;
  }
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  html, body {
    width: 210mm;
    min-height: 297mm;
  }
  body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 11px;
    line-height: 1.4;
    color: #1a1a1a;
    background: white;
  }
  .invoice-page {
    width: 210mm;
    min-height: 297mm;
    padding: 15mm 20mm;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .invoice-content {
    flex: 1;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    padding: 10px 12px;
    text-align: left;
    vertical-align: top;
  }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-bold { font-weight: 600; }

  /* Page break handling for long invoices */
  .items-table {
    page-break-inside: auto;
  }
  .items-table tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  .no-break {
    page-break-inside: avoid;
  }
`;

/**
 * Simple template - Clean and minimal
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
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e5e5;
    }
    .company-info {
      max-width: 60%;
    }
    .company-name {
      font-size: 22px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    .company-details {
      font-size: 10px;
      color: #666;
      line-height: 1.6;
    }
    .invoice-title-section {
      text-align: right;
    }
    .invoice-title {
      font-size: 32px;
      font-weight: 700;
      color: #333;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-size: 14px;
      color: #666;
    }

    .billing-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      gap: 40px;
    }
    .billing-box {
      flex: 1;
    }
    .billing-label {
      font-size: 10px;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .billing-name {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .billing-details {
      font-size: 11px;
      color: #555;
      line-height: 1.6;
    }
    .invoice-details {
      text-align: right;
    }
    .invoice-details table {
      margin-left: auto;
      width: auto;
    }
    .invoice-details td {
      padding: 4px 0;
      font-size: 11px;
    }
    .invoice-details td:first-child {
      color: #666;
      padding-right: 20px;
    }
    .invoice-details td:last-child {
      font-weight: 500;
    }

    .items-table {
      margin-bottom: 30px;
    }
    .items-table thead th {
      background: #f8f9fa;
      border-bottom: 2px solid #dee2e6;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #555;
      padding: 12px;
    }
    .items-table tbody td {
      border-bottom: 1px solid #eee;
      padding: 12px;
      font-size: 11px;
    }
    .items-table tbody tr:hover {
      background: #fafafa;
    }

    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .totals-table {
      width: 280px;
    }
    .totals-table td {
      padding: 8px 0;
      font-size: 11px;
    }
    .totals-table tr:last-child td {
      padding-top: 12px;
      border-top: 2px solid #1a1a1a;
      font-size: 16px;
      font-weight: 700;
    }

    .footer-section {
      margin-top: auto;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .notes-section {
      margin-bottom: 15px;
    }
    .notes-label {
      font-size: 10px;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .notes-content {
      font-size: 10px;
      color: #666;
      line-height: 1.5;
    }
    .legal-footer {
      text-align: center;
      font-size: 9px;
      color: #999;
      padding-top: 15px;
      border-top: 1px solid #f0f0f0;
    }
  </style>
</head>
<body>
  <div class="invoice-page">
    <div class="invoice-content">
      <div class="header">
        <div class="company-info">
          <div class="company-name">${escapeHtml(config.company.name)}</div>
          <div class="company-details">
            ${config.company.address ? `${escapeHtml(config.company.address)}<br>` : ''}
            ${config.company.phone ? `Tel: ${escapeHtml(config.company.phone)}` : ''}
            ${config.company.phone && config.company.email ? ' | ' : ''}
            ${config.company.email ? `${escapeHtml(config.company.email)}` : ''}<br>
            ${config.company.website ? `${escapeHtml(config.company.website)}` : ''}
            ${config.showFields.taxId && config.company.taxId ? `<br>Tax ID: ${escapeHtml(config.company.taxId)}` : ''}
          </div>
        </div>
        <div class="invoice-title-section">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-number">#${escapeHtml(invoice.invoiceNumber)}</div>
        </div>
      </div>

      <div class="billing-section">
        <div class="billing-box">
          <div class="billing-label">Bill To</div>
          <div class="billing-name">${escapeHtml(invoice.customer.name)}</div>
          <div class="billing-details">
            ${invoice.customer.address?.line1 ? `${escapeHtml(invoice.customer.address.line1)}<br>` : ''}
            ${invoice.customer.address?.city ? `${escapeHtml(invoice.customer.address.city)}` : ''}
            ${invoice.customer.address?.state ? `, ${escapeHtml(invoice.customer.address.state)}` : ''}
            ${invoice.customer.address?.postalCode ? ` ${escapeHtml(invoice.customer.address.postalCode)}` : ''}
            ${invoice.customer.address?.country ? `<br>${escapeHtml(invoice.customer.address.country)}` : ''}
            ${invoice.customer.email ? `<br>${escapeHtml(invoice.customer.email)}` : ''}
            ${invoice.customer.phone ? `<br>${escapeHtml(invoice.customer.phone)}` : ''}
            ${invoice.customer.taxId ? `<br>Tax ID: ${escapeHtml(invoice.customer.taxId)}` : ''}
          </div>
        </div>
        <div class="billing-box invoice-details">
          <table>
            <tr>
              <td>Invoice Date:</td>
              <td>${formatDate(invoice.issueDate, config.dateFormat)}</td>
            </tr>
            ${invoice.dueDate ? `
            <tr>
              <td>Due Date:</td>
              <td>${formatDate(invoice.dueDate, config.dateFormat)}</td>
            </tr>
            ` : ''}
            ${invoice.poNumber ? `
            <tr>
              <td>PO Number:</td>
              <td>${escapeHtml(invoice.poNumber)}</td>
            </tr>
            ` : ''}
            ${invoice.currency !== 'USD' ? `
            <tr>
              <td>Currency:</td>
              <td>${invoice.currency}</td>
            </tr>
            ` : ''}
          </table>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 50%">Description</th>
            <th class="text-center" style="width: 12%">Qty</th>
            <th class="text-right" style="width: 18%">Unit Price</th>
            <th class="text-right" style="width: 20%">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.lineItems.map(item => `
          <tr>
            <td>${escapeHtml(item.description)}</td>
            <td class="text-center">${formatNumber(item.quantity, config.numberFormat)}</td>
            <td class="text-right">${formatMoney(item.unitPrice, config)}</td>
            <td class="text-right">${formatMoney(item.lineTotal, config)}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-section no-break">
        <table class="totals-table">
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
          ${invoice.totalTax > 0 ? `
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
    </div>

    <div class="footer-section no-break">
      ${invoice.notes ? `
      <div class="notes-section">
        <div class="notes-label">Notes</div>
        <div class="notes-content">${escapeHtml(invoice.notes)}</div>
      </div>
      ` : ''}

      ${config.bankDetails ? `
      <div class="notes-section">
        <div class="notes-label">Payment Information</div>
        <div class="notes-content">
          Bank: ${escapeHtml(config.bankDetails.bankName)} |
          Account: ${escapeHtml(config.bankDetails.accountNumber)}
          ${config.bankDetails.swift ? ` | SWIFT: ${escapeHtml(config.bankDetails.swift)}` : ''}
          ${config.bankDetails.iban ? ` | IBAN: ${escapeHtml(config.bankDetails.iban)}` : ''}
        </div>
      </div>
      ` : ''}

      ${config.footerText ? `
      <div class="notes-section">
        <div class="notes-content">${escapeHtml(config.footerText)}</div>
      </div>
      ` : ''}

      <div class="legal-footer">
        This is a computer-generated invoice.
        ${config.company.name} ${config.company.taxId ? `| Tax ID: ${config.company.taxId}` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Simple + Logo template
 */
function renderSimpleLogoTemplate(invoice: Invoice, config: GenerationConfig): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${commonStyles}

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e5e5;
    }
    .company-info {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      max-width: 60%;
    }
    .company-logo {
      max-height: 60px;
      max-width: 120px;
      object-fit: contain;
    }
    .company-text {
      flex: 1;
    }
    .company-name {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 6px;
    }
    .company-details {
      font-size: 10px;
      color: #666;
      line-height: 1.6;
    }
    .invoice-title-section {
      text-align: right;
    }
    .invoice-title {
      font-size: 32px;
      font-weight: 700;
      color: #333;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-size: 14px;
      color: #666;
    }

    .billing-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      gap: 40px;
    }
    .billing-box { flex: 1; }
    .billing-label {
      font-size: 10px;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .billing-name {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .billing-details {
      font-size: 11px;
      color: #555;
      line-height: 1.6;
    }
    .invoice-details { text-align: right; }
    .invoice-details table { margin-left: auto; width: auto; }
    .invoice-details td { padding: 4px 0; font-size: 11px; }
    .invoice-details td:first-child { color: #666; padding-right: 20px; }
    .invoice-details td:last-child { font-weight: 500; }

    .items-table { margin-bottom: 30px; }
    .items-table thead th {
      background: #f8f9fa;
      border-bottom: 2px solid #dee2e6;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #555;
      padding: 12px;
    }
    .items-table tbody td {
      border-bottom: 1px solid #eee;
      padding: 12px;
      font-size: 11px;
    }

    .totals-section { display: flex; justify-content: flex-end; margin-bottom: 30px; }
    .totals-table { width: 280px; }
    .totals-table td { padding: 8px 0; font-size: 11px; }
    .totals-table tr:last-child td {
      padding-top: 12px;
      border-top: 2px solid #1a1a1a;
      font-size: 16px;
      font-weight: 700;
    }

    .footer-section { margin-top: auto; padding-top: 20px; border-top: 1px solid #eee; }
    .notes-section { margin-bottom: 15px; }
    .notes-label { font-size: 10px; font-weight: 600; color: #888; text-transform: uppercase; margin-bottom: 5px; }
    .notes-content { font-size: 10px; color: #666; line-height: 1.5; }
    .legal-footer { text-align: center; font-size: 9px; color: #999; padding-top: 15px; border-top: 1px solid #f0f0f0; }
  </style>
</head>
<body>
  <div class="invoice-page">
    <div class="invoice-content">
      <div class="header">
        <div class="company-info">
          ${config.company.logo ? `<img class="company-logo" src="${config.company.logo}" />` : ''}
          <div class="company-text">
            <div class="company-name">${escapeHtml(config.company.name)}</div>
            <div class="company-details">
              ${config.company.address ? `${escapeHtml(config.company.address)}<br>` : ''}
              ${config.company.phone ? `Tel: ${escapeHtml(config.company.phone)}` : ''}
              ${config.company.phone && config.company.email ? ' | ' : ''}
              ${config.company.email ? `${escapeHtml(config.company.email)}` : ''}<br>
              ${config.company.website ? `${escapeHtml(config.company.website)}` : ''}
              ${config.showFields.taxId && config.company.taxId ? `<br>Tax ID: ${escapeHtml(config.company.taxId)}` : ''}
            </div>
          </div>
        </div>
        <div class="invoice-title-section">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-number">#${escapeHtml(invoice.invoiceNumber)}</div>
        </div>
      </div>

      <div class="billing-section">
        <div class="billing-box">
          <div class="billing-label">Bill To</div>
          <div class="billing-name">${escapeHtml(invoice.customer.name)}</div>
          <div class="billing-details">
            ${invoice.customer.address?.line1 ? `${escapeHtml(invoice.customer.address.line1)}<br>` : ''}
            ${invoice.customer.address?.city ? `${escapeHtml(invoice.customer.address.city)}` : ''}
            ${invoice.customer.address?.state ? `, ${escapeHtml(invoice.customer.address.state)}` : ''}
            ${invoice.customer.address?.postalCode ? ` ${escapeHtml(invoice.customer.address.postalCode)}` : ''}
            ${invoice.customer.email ? `<br>${escapeHtml(invoice.customer.email)}` : ''}
          </div>
        </div>
        <div class="billing-box invoice-details">
          <table>
            <tr><td>Invoice Date:</td><td>${formatDate(invoice.issueDate, config.dateFormat)}</td></tr>
            ${invoice.dueDate ? `<tr><td>Due Date:</td><td>${formatDate(invoice.dueDate, config.dateFormat)}</td></tr>` : ''}
            ${invoice.poNumber ? `<tr><td>PO Number:</td><td>${escapeHtml(invoice.poNumber)}</td></tr>` : ''}
          </table>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 50%">Description</th>
            <th class="text-center" style="width: 12%">Qty</th>
            <th class="text-right" style="width: 18%">Unit Price</th>
            <th class="text-right" style="width: 20%">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.lineItems.map(item => `
          <tr>
            <td>${escapeHtml(item.description)}</td>
            <td class="text-center">${formatNumber(item.quantity, config.numberFormat)}</td>
            <td class="text-right">${formatMoney(item.unitPrice, config)}</td>
            <td class="text-right">${formatMoney(item.lineTotal, config)}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-section no-break">
        <table class="totals-table">
          <tr><td>Subtotal</td><td class="text-right">${formatMoney(invoice.subtotal, config)}</td></tr>
          ${invoice.totalDiscount > 0 ? `<tr><td>Discount</td><td class="text-right">-${formatMoney(invoice.totalDiscount, config)}</td></tr>` : ''}
          ${invoice.totalTax > 0 ? `<tr><td>Tax</td><td class="text-right">${formatMoney(invoice.totalTax, config)}</td></tr>` : ''}
          <tr><td>Total Due</td><td class="text-right">${formatMoney(invoice.grandTotal, config)}</td></tr>
        </table>
      </div>
    </div>

    <div class="footer-section no-break">
      ${invoice.notes ? `<div class="notes-section"><div class="notes-label">Notes</div><div class="notes-content">${escapeHtml(invoice.notes)}</div></div>` : ''}
      ${config.bankDetails ? `<div class="notes-section"><div class="notes-label">Payment Information</div><div class="notes-content">Bank: ${escapeHtml(config.bankDetails.bankName)} | Account: ${escapeHtml(config.bankDetails.accountNumber)}${config.bankDetails.swift ? ` | SWIFT: ${escapeHtml(config.bankDetails.swift)}` : ''}</div></div>` : ''}
      ${config.footerText ? `<div class="notes-section"><div class="notes-content">${escapeHtml(config.footerText)}</div></div>` : ''}
      <div class="legal-footer">This is a computer-generated invoice. ${config.company.name}</div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Professional template - Modern with accent color
 */
function renderProfessionalTemplate(invoice: Invoice, config: GenerationConfig): string {
  const accentColor = config.headerColor || '#3B82F6'; // Use config color or default blue

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${commonStyles}

    @page {
      size: 210mm 297mm;
      margin: 0;
    }
    html, body {
      width: 210mm;
      margin: 0 !important;
      padding: 0 !important;
    }
    .invoice-page {
      width: 210mm;
      padding: 0 !important;
      margin: 0 !important;
    }
    .header {
      background: ${accentColor};
      color: white;
      padding: 25px 30px;
      width: 210mm;
      box-sizing: border-box;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .page-content {
      padding: 25px 20mm 15mm 20mm;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .company-logo {
      max-height: 50px;
      max-width: 100px;
      object-fit: contain;
      background: white;
      padding: 5px;
      border-radius: 4px;
    }
    .company-name {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .company-tagline {
      font-size: 11px;
      opacity: 0.9;
    }
    .header-right {
      text-align: right;
    }
    .invoice-label {
      font-size: 11px;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .invoice-number {
      font-size: 24px;
      font-weight: 700;
    }

    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      gap: 30px;
    }
    .info-box {
      flex: 1;
    }
    .info-box.right {
      text-align: right;
    }
    .info-label {
      font-size: 10px;
      font-weight: 600;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid ${accentColor};
      display: inline-block;
    }
    .info-name {
      font-size: 15px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 5px;
    }
    .info-details {
      font-size: 11px;
      color: #555;
      line-height: 1.7;
    }
    .info-grid {
      display: grid;
      grid-template-columns: auto auto;
      gap: 8px 20px;
      font-size: 11px;
    }
    .info-grid dt {
      color: #888;
    }
    .info-grid dd {
      font-weight: 500;
      text-align: right;
    }

    .items-table {
      margin-bottom: 25px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .items-table thead th {
      background: ${accentColor};
      color: white;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 14px 12px;
    }
    .items-table tbody td {
      padding: 14px 12px;
      font-size: 11px;
      border-bottom: 1px solid #f0f0f0;
    }
    .items-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .items-table tbody tr:last-child td {
      border-bottom: none;
    }

    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .totals-box {
      width: 300px;
      background: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e5e7eb;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 12px;
    }
    .totals-row.total {
      border-top: 2px solid ${accentColor};
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: 700;
      color: ${accentColor};
    }

    .footer-section {
      margin-top: auto;
      padding-top: 25px;
      border-top: 1px solid #e5e7eb;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .footer-box h4 {
      font-size: 10px;
      font-weight: 600;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .footer-box p {
      font-size: 10px;
      color: #666;
      line-height: 1.6;
    }
    .legal-footer {
      text-align: center;
      font-size: 9px;
      color: #999;
      padding-top: 15px;
      border-top: 1px solid #f0f0f0;
    }
  </style>
</head>
<body>
  <div class="invoice-page">
    <div class="header">
      <div class="header-left">
        ${config.company.logo ? `<img class="company-logo" src="${config.company.logo}" />` : ''}
        <div>
          <div class="company-name">${escapeHtml(config.company.name)}</div>
          ${config.company.website ? `<div class="company-tagline">${escapeHtml(config.company.website)}</div>` : ''}
        </div>
      </div>
      <div class="header-right">
        <div class="invoice-label">Invoice</div>
        <div class="invoice-number">#${escapeHtml(invoice.invoiceNumber)}</div>
      </div>
    </div>
    <div class="page-content">
    <div class="invoice-content">
      <div class="info-section">
        <div class="info-box">
          <div class="info-label">From</div>
          <div class="info-name">${escapeHtml(config.company.name)}</div>
          <div class="info-details">
            ${config.company.address ? `${escapeHtml(config.company.address)}<br>` : ''}
            ${config.company.phone ? `Tel: ${escapeHtml(config.company.phone)}<br>` : ''}
            ${config.company.email ? `${escapeHtml(config.company.email)}<br>` : ''}
            ${config.company.taxId ? `Tax ID: ${escapeHtml(config.company.taxId)}` : ''}
          </div>
        </div>
        <div class="info-box">
          <div class="info-label">Bill To</div>
          <div class="info-name">${escapeHtml(invoice.customer.name)}</div>
          <div class="info-details">
            ${invoice.customer.address?.line1 ? `${escapeHtml(invoice.customer.address.line1)}<br>` : ''}
            ${invoice.customer.address?.city ? `${escapeHtml(invoice.customer.address.city)}` : ''}
            ${invoice.customer.address?.state ? `, ${escapeHtml(invoice.customer.address.state)}` : ''}
            ${invoice.customer.address?.postalCode ? ` ${escapeHtml(invoice.customer.address.postalCode)}` : ''}
            ${invoice.customer.email ? `<br>${escapeHtml(invoice.customer.email)}` : ''}
          </div>
        </div>
        <div class="info-box right">
          <div class="info-label">Details</div>
          <dl class="info-grid">
            <dt>Date:</dt>
            <dd>${formatDate(invoice.issueDate, config.dateFormat)}</dd>
            ${invoice.dueDate ? `<dt>Due:</dt><dd>${formatDate(invoice.dueDate, config.dateFormat)}</dd>` : ''}
            ${invoice.poNumber ? `<dt>PO #:</dt><dd>${escapeHtml(invoice.poNumber)}</dd>` : ''}
            <dt>Currency:</dt>
            <dd>${invoice.currency}</dd>
          </dl>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 45%">Description</th>
            <th class="text-center" style="width: 12%">Qty</th>
            <th class="text-right" style="width: 18%">Rate</th>
            <th class="text-right" style="width: 25%">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.lineItems.map(item => `
          <tr>
            <td><strong>${escapeHtml(item.description)}</strong></td>
            <td class="text-center">${formatNumber(item.quantity, config.numberFormat)}</td>
            <td class="text-right">${formatMoney(item.unitPrice, config)}</td>
            <td class="text-right"><strong>${formatMoney(item.lineTotal, config)}</strong></td>
          </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-section no-break">
        <div class="totals-box">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>${formatMoney(invoice.subtotal, config)}</span>
          </div>
          ${invoice.totalDiscount > 0 ? `
          <div class="totals-row">
            <span>Discount</span>
            <span>-${formatMoney(invoice.totalDiscount, config)}</span>
          </div>
          ` : ''}
          ${invoice.totalTax > 0 ? `
          <div class="totals-row">
            <span>Tax</span>
            <span>${formatMoney(invoice.totalTax, config)}</span>
          </div>
          ` : ''}
          <div class="totals-row total">
            <span>Total Due</span>
            <span>${formatMoney(invoice.grandTotal, config)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-section no-break">
      <div class="footer-grid">
        ${invoice.notes || config.footerText ? `
        <div class="footer-box">
          <h4>Notes & Terms</h4>
          <p>
            ${invoice.notes ? escapeHtml(invoice.notes) : ''}
            ${invoice.notes && config.footerText ? '<br><br>' : ''}
            ${config.footerText ? escapeHtml(config.footerText) : ''}
          </p>
        </div>
        ` : '<div></div>'}
        ${config.bankDetails ? `
        <div class="footer-box">
          <h4>Payment Information</h4>
          <p>
            <strong>Bank:</strong> ${escapeHtml(config.bankDetails.bankName)}<br>
            <strong>Account:</strong> ${escapeHtml(config.bankDetails.accountNumber)}<br>
            ${config.bankDetails.swift ? `<strong>SWIFT:</strong> ${escapeHtml(config.bankDetails.swift)}<br>` : ''}
            ${config.bankDetails.iban ? `<strong>IBAN:</strong> ${escapeHtml(config.bankDetails.iban)}` : ''}
          </p>
        </div>
        ` : '<div></div>'}
      </div>
      <div class="legal-footer">
        This is a computer-generated invoice. | ${escapeHtml(config.company.name)}
        ${config.company.taxId ? ` | Tax ID: ${escapeHtml(config.company.taxId)}` : ''}
      </div>
    </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Tax Invoice template - Compliance focused
 */
function renderTaxInvoiceTemplate(invoice: Invoice, config: GenerationConfig): string {
  // Calculate tax using config.taxRate if items don't have their own tax rates
  const defaultTaxRate = config.taxRate || 0;

  // Calculate totals with applied tax rate
  const itemsWithTax = invoice.lineItems.map(item => {
    const taxRate = item.taxRate ?? defaultTaxRate;
    const taxAmount = item.taxAmount ?? (item.lineTotal * taxRate / 100);
    return { ...item, taxRate, taxAmount };
  });

  const calculatedTotalTax = itemsWithTax.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  const totalTax = invoice.totalTax > 0 ? invoice.totalTax : calculatedTotalTax;
  const grandTotal = invoice.grandTotal > 0 ? invoice.grandTotal : invoice.subtotal + totalTax - invoice.totalDiscount;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${commonStyles}

    .tax-banner {
      background: #1a1a1a;
      color: white;
      text-align: center;
      padding: 12px;
      margin: -15mm -20mm 20px -20mm;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 4px;
    }

    .company-header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #333;
    }
    .company-logo-center {
      max-height: 50px;
      margin-bottom: 10px;
    }
    .company-name {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    .company-details {
      font-size: 11px;
      color: #555;
      line-height: 1.6;
    }
    .tax-id-badge {
      display: inline-block;
      background: #f0f0f0;
      padding: 5px 15px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 8px;
    }

    .invoice-meta {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 25px;
    }
    .meta-item {
      text-align: center;
      padding: 12px 25px;
      border: 1px solid #ddd;
      background: #fafafa;
    }
    .meta-label {
      font-size: 9px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .meta-value {
      font-size: 14px;
      font-weight: 700;
    }

    .parties-section {
      display: flex;
      gap: 20px;
      margin-bottom: 25px;
    }
    .party-box {
      flex: 1;
      padding: 15px;
      background: #f8f9fa;
      border-left: 3px solid #333;
    }
    .party-label {
      font-size: 9px;
      font-weight: 700;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .party-name {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .party-details {
      font-size: 10px;
      color: #555;
      line-height: 1.6;
    }

    .items-table {
      margin-bottom: 20px;
    }
    .items-table thead th {
      background: #333;
      color: white;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 8px;
      font-weight: 600;
    }
    .items-table tbody td {
      padding: 12px 8px;
      font-size: 10px;
      border-bottom: 1px solid #eee;
    }
    .items-table tbody tr:nth-child(even) {
      background: #fafafa;
    }

    .summary-section {
      display: flex;
      gap: 20px;
      margin-bottom: 25px;
    }
    .tax-summary {
      flex: 1;
      padding: 15px;
      background: #f8f9fa;
      border: 1px solid #ddd;
    }
    .tax-summary h4 {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 10px;
      color: #555;
    }
    .tax-summary table td {
      padding: 5px 0;
      font-size: 11px;
    }
    .totals-table {
      width: 320px;
    }
    .totals-table td {
      padding: 8px 0;
      font-size: 11px;
    }
    .totals-table tr:last-child {
      font-weight: 700;
      font-size: 16px;
    }
    .totals-table tr:last-child td {
      padding-top: 12px;
      border-top: 2px solid #333;
    }

    .footer-section {
      margin-top: auto;
      padding-top: 20px;
    }
    .bank-details {
      padding: 12px;
      background: #f8f9fa;
      border: 1px solid #ddd;
      margin-bottom: 15px;
      font-size: 10px;
    }
    .bank-details h4 {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .legal-footer {
      text-align: center;
      font-size: 9px;
      color: #888;
      padding: 15px 0;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="invoice-page">
    <div class="invoice-content">
      <div class="tax-banner">TAX INVOICE</div>

      <div class="company-header">
        ${config.company.logo ? `<img class="company-logo-center" src="${config.company.logo}" /><br>` : ''}
        <div class="company-name">${escapeHtml(config.company.name)}</div>
        <div class="company-details">
          ${config.company.address ? `${escapeHtml(config.company.address)}<br>` : ''}
          ${config.company.phone ? `Tel: ${escapeHtml(config.company.phone)}` : ''}
          ${config.company.phone && config.company.email ? ' | ' : ''}
          ${config.company.email ? `${escapeHtml(config.company.email)}` : ''}
          ${config.company.website ? `<br>${escapeHtml(config.company.website)}` : ''}
        </div>
        ${config.company.taxId ? `<div class="tax-id-badge">Tax Registration: ${escapeHtml(config.company.taxId)}</div>` : ''}
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
        ${invoice.dueDate ? `
        <div class="meta-item">
          <div class="meta-label">Due Date</div>
          <div class="meta-value">${formatDate(invoice.dueDate, config.dateFormat)}</div>
        </div>
        ` : ''}
      </div>

      <div class="parties-section">
        <div class="party-box">
          <div class="party-label">Supplier Details</div>
          <div class="party-name">${escapeHtml(config.company.name)}</div>
          <div class="party-details">
            ${config.company.address ? `${escapeHtml(config.company.address)}<br>` : ''}
            ${config.company.taxId ? `Tax ID: ${escapeHtml(config.company.taxId)}` : ''}
          </div>
        </div>
        <div class="party-box">
          <div class="party-label">Customer Details</div>
          <div class="party-name">${escapeHtml(invoice.customer.name)}</div>
          <div class="party-details">
            ${invoice.customer.address?.line1 ? `${escapeHtml(invoice.customer.address.line1)}<br>` : ''}
            ${invoice.customer.address?.city ? `${escapeHtml(invoice.customer.address.city)}` : ''}
            ${invoice.customer.address?.state ? `, ${escapeHtml(invoice.customer.address.state)}` : ''}
            ${invoice.customer.taxId ? `<br>Tax ID: ${escapeHtml(invoice.customer.taxId)}` : ''}
          </div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 35%">Description</th>
            <th class="text-center" style="width: 10%">Qty</th>
            <th class="text-right" style="width: 15%">Unit Price</th>
            <th class="text-right" style="width: 10%">Tax %</th>
            <th class="text-right" style="width: 12%">Tax Amt</th>
            <th class="text-right" style="width: 13%">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsWithTax.map((item, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${escapeHtml(item.description)}</strong>${item.sku ? `<br><small>SKU: ${item.sku}</small>` : ''}</td>
            <td class="text-center">${formatNumber(item.quantity, config.numberFormat)}</td>
            <td class="text-right">${formatMoney(item.unitPrice, config)}</td>
            <td class="text-right">${item.taxRate}%</td>
            <td class="text-right">${formatMoney(item.taxAmount, config)}</td>
            <td class="text-right"><strong>${formatMoney(item.lineTotal + item.taxAmount, config)}</strong></td>
          </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="summary-section no-break">
        <div class="tax-summary">
          <h4>Tax Summary</h4>
          <table>
            <tr>
              <td>Taxable Amount:</td>
              <td class="text-right">${formatMoney(invoice.subtotal, config)}</td>
            </tr>
            <tr>
              <td>Tax Rate:</td>
              <td class="text-right">${defaultTaxRate}%</td>
            </tr>
            <tr>
              <td>Total Tax:</td>
              <td class="text-right">${formatMoney(totalTax, config)}</td>
            </tr>
          </table>
        </div>
        <table class="totals-table">
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
            <td>Tax (${defaultTaxRate}%):</td>
            <td class="text-right">${formatMoney(totalTax, config)}</td>
          </tr>
          <tr>
            <td>Grand Total:</td>
            <td class="text-right">${formatMoney(grandTotal, config)}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="footer-section no-break">
      ${config.bankDetails ? `
      <div class="bank-details">
        <h4>Bank Details for Payment</h4>
        Bank: ${escapeHtml(config.bankDetails.bankName)} |
        Account Name: ${escapeHtml(config.bankDetails.accountName)} |
        Account No: ${escapeHtml(config.bankDetails.accountNumber)}
        ${config.bankDetails.swift ? ` | SWIFT: ${escapeHtml(config.bankDetails.swift)}` : ''}
        ${config.bankDetails.iban ? ` | IBAN: ${escapeHtml(config.bankDetails.iban)}` : ''}
      </div>
      ` : ''}

      ${config.footerText ? `<div style="font-size: 10px; color: #666; margin-bottom: 15px;">${escapeHtml(config.footerText)}</div>` : ''}

      <div class="legal-footer">
        This is a computer-generated tax invoice. No signature required.<br>
        ${escapeHtml(config.company.name)}${config.company.taxId ? ` | Tax Registration No: ${escapeHtml(config.company.taxId)}` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
