import Fuse from 'fuse.js';
import type { ColumnMapping } from '@excel-to-invoice/shared';

/**
 * Field definitions with patterns for auto-detection
 * Comprehensive library covering:
 * - QuickBooks, Xero, Zoho, Wave, FreshBooks exports
 * - International variations (UK, AU, IN, EU)
 * - Common abbreviations and typos
 */
interface FieldDefinition {
  field: string;
  patterns: string[];
  required: boolean;
  dataTypeHints?: string[]; // Helps identify fields by data patterns
}

const FIELD_DEFINITIONS: FieldDefinition[] = [
  // ============================================
  // INVOICE IDENTIFICATION FIELDS
  // ============================================
  {
    field: 'invoiceNumber',
    patterns: [
      // Standard variations
      'invoice number', 'invoice no', 'invoice #', 'invoice no.', 'invoice num',
      'inv no', 'inv #', 'inv no.', 'inv num', 'inv number',
      'invoice_no', 'invoice_number', 'invoiceno', 'invoicenumber', 'invoice-no',
      // Document references
      'doc no', 'doc #', 'doc number', 'document number', 'document no',
      'document id', 'doc id', 'document_number', 'document_no',
      // Bill references
      'bill no', 'bill #', 'bill number', 'bill_no', 'bill_number',
      // Reference numbers
      'reference', 'ref', 'ref no', 'ref #', 'ref.', 'reference number', 'reference no',
      'ref number', 'ref_no', 'reference_number', 'ref_number',
      // Transaction references
      'transaction no', 'transaction number', 'trans no', 'trans #', 'txn no', 'txn #',
      'transaction_no', 'transaction_number', 'transaction id', 'trans id',
      // QuickBooks specific
      'num', 'no.', 'number', 'txn number',
      // Xero specific
      'invoice ref', 'inv ref', 'credit note number',
      // Zoho specific
      'invoice#', 'creditnote#', 'bill#',
      // International
      'factura no', 'factura numero', 'rechnung nr', 'rechnungsnummer', // Spanish/German
      'fattura n', 'numero fattura', // Italian
      'facture no', 'numéro facture', // French
      'faktura nr', // Polish/Nordic
    ],
    required: true,
    dataTypeHints: ['INV-', 'INV', 'BILL-', 'REF-', 'DOC-'],
  },
  {
    field: 'issueDate',
    patterns: [
      // Standard variations
      'invoice date', 'date', 'issue date', 'issued date', 'issued',
      'invoice_date', 'issue_date', 'invoicedate', 'issuedate',
      // Document dates
      'doc date', 'document date', 'doc_date', 'document_date',
      // Bill dates
      'bill date', 'billed date', 'bill_date',
      // Transaction dates
      'transaction date', 'trans date', 'txn date', 'transaction_date',
      // Creation dates
      'created', 'created date', 'create date', 'created_date', 'creation date',
      'date created', 'date_created',
      // QuickBooks
      'date', 'txn date',
      // Xero
      'issue date', 'raised date',
      // Zoho
      'invoice date', 'created time',
      // International
      'fecha', 'fecha factura', 'datum', 'rechnungsdatum', // Spanish/German
      'data', 'data fattura', // Italian
      'date facture', // French
    ],
    required: true,
  },
  {
    field: 'dueDate',
    patterns: [
      // Standard variations
      'due date', 'due', 'payment due', 'due_date', 'duedate',
      'payment due date', 'pay due', 'pay due date',
      // Payment terms
      'pay by', 'pay by date', 'payable by', 'payable date',
      'payment date', 'payment_date', 'pmt date',
      // Net terms
      'net date', 'terms date',
      // Expiry
      'expiry', 'expiry date', 'expires', 'valid until', 'valid till',
      // QuickBooks
      'due date', 'due',
      // Xero
      'due date', 'expected payment',
      // Zoho
      'due date', 'expected date',
      // International
      'fecha vencimiento', 'vencimiento', 'fällig', 'fälligkeitsdatum', // Spanish/German
      'scadenza', 'data scadenza', // Italian
      'date échéance', 'échéance', // French
    ],
    required: false,
  },

  // ============================================
  // CUSTOMER/CLIENT FIELDS
  // ============================================
  {
    field: 'customerName',
    patterns: [
      // Customer variations
      'customer', 'customer name', 'cust', 'cust name', 'cust. name',
      'customer_name', 'customername', 'cust_name',
      // Client variations
      'client', 'client name', 'client_name', 'clientname',
      // Name variations (without company - company is separate field)
      'name', 'full name', 'fullname', 'full_name', 'contact name',
      // Buyer variations
      'buyer', 'buyer name', 'buyer_name', 'purchaser', 'purchaser name',
      // Billing variations
      'bill to', 'billed to', 'bill to name', 'billto', 'bill_to',
      'billing name', 'billing_name', 'invoice to',
      // Sold to variations
      'sold to', 'sold_to', 'soldto', 'sell to',
      // Ship to (often same as customer)
      'ship to', 'ship to name', 'shipto', 'ship_to', 'shipping name',
      // Contact variations
      'contact', 'contact name', 'contact_name', 'contactname',
      // Account variations
      'account', 'account name', 'account_name', 'acct name', 'acct',
      // QuickBooks
      'name', 'customer/job', 'customer:job',
      // Xero
      'contact name', 'contact', 'to',
      // Zoho
      'customer name', 'customer/vendor',
      // Wave
      'customer', 'client name',
      // FreshBooks
      'client', 'customer',
      // International
      'cliente', 'nombre cliente', 'kunde', 'kundenname', // Spanish/German
      'cliente', 'nome cliente', // Italian/Portuguese
      'client', 'nom client', // French
      'klant', 'klantnaam', // Dutch
    ],
    required: true,
  },
  {
    field: 'customerEmail',
    patterns: [
      // Email variations
      'email', 'e-mail', 'e mail', 'email address', 'email_address', 'emailaddress',
      // Customer email
      'customer email', 'customer_email', 'customeremail', 'cust email', 'cust_email',
      // Client email
      'client email', 'client_email', 'clientemail',
      // Contact email
      'contact email', 'contact_email', 'contactemail',
      // Billing email
      'billing email', 'billing_email', 'bill to email', 'invoice email',
      // Primary email
      'primary email', 'main email',
      // QuickBooks
      'email', 'main email',
      // Xero
      'email address', 'contact email',
      // International
      'correo', 'correo electrónico', 'e-mail', 'email', // Spanish
      'courriel', 'adresse email', // French
    ],
    required: false,
  },
  {
    field: 'customerPhone',
    patterns: [
      // Phone variations
      'phone', 'phone number', 'phone_number', 'phonenumber', 'phone no',
      'telephone', 'tel', 'tel.', 'tel no', 'telephone number',
      // Mobile variations
      'mobile', 'mobile number', 'mobile_number', 'mob', 'cell', 'cell phone', 'cellphone',
      // Customer phone
      'customer phone', 'customer_phone', 'cust phone', 'client phone', 'client_phone',
      // Contact variations
      'contact', 'contact number', 'contact_number', 'contact phone',
      // Work/Business phone
      'work phone', 'business phone', 'office phone', 'office',
      // Primary phone
      'primary phone', 'main phone',
      // Fax (sometimes used as phone)
      'fax', 'fax number',
      // QuickBooks/Xero
      'phone', 'main phone', 'work',
      // International
      'teléfono', 'telefono', 'telefon', // Spanish/German
      'téléphone', // French
    ],
    required: false,
  },
  {
    field: 'customerAddress',
    patterns: [
      // Address variations
      'address', 'full address', 'address_full', 'fulladdress', 'addr',
      // Customer address
      'customer address', 'customer_address', 'cust address', 'cust_address',
      'client address', 'client_address',
      // Billing address
      'billing address', 'billing_address', 'billingaddress', 'bill address', 'bill_address',
      'bill to address', 'billto address', 'invoice address',
      // Street address
      'street', 'street address', 'street_address', 'streetaddress',
      'address line 1', 'address1', 'address_1', 'addr1', 'line 1',
      'address line', 'address_line',
      // Shipping address (often same)
      'shipping address', 'shipping_address', 'ship address', 'ship_address',
      'ship to address', 'shipto address',
      // Mailing address
      'mailing address', 'mailing_address', 'postal address',
      // Location
      'location', 'business address', 'company address',
      // QuickBooks
      'bill to', 'billing address',
      // Xero
      'address', 'postal address',
      // International
      'dirección', 'direccion', 'adresse', 'anschrift', // Spanish/French/German
      'indirizzo', 'endereço', // Italian/Portuguese
    ],
    required: false,
  },
  {
    field: 'customerCompany',
    patterns: [
      'company', 'company name', 'company_name', 'companyname', 'co name',
      'business name', 'business', 'business_name', 'org name', 'organization',
      'organisation', 'firm', 'firm name', 'enterprise', 'entity',
      'customer company', 'customer_company', 'client company', 'client_company',
      // International
      'empresa', 'sociedad', 'firma', 'unternehmen', 'gesellschaft', // Spanish/German
      'azienda', 'société', 'entreprise', // Italian/French
    ],
    required: false,
  },
  {
    field: 'customerCity',
    patterns: [
      'city', 'city name', 'town', 'municipality', 'suburb',
      'customer city', 'billing city', 'bill city',
      // International
      'ciudad', 'stadt', 'città', 'ville', 'cidade',
    ],
    required: false,
  },
  {
    field: 'customerState',
    patterns: [
      'state', 'state/province', 'province', 'region', 'county',
      'customer state', 'billing state', 'bill state',
      // International
      'estado', 'bundesland', 'provincia', 'région',
    ],
    required: false,
  },
  {
    field: 'customerPostalCode',
    patterns: [
      'postal code', 'postalcode', 'postal_code', 'zip', 'zip code', 'zipcode', 'zip_code',
      'postcode', 'post code', 'post_code', 'pin', 'pin code', 'pincode',
      'customer postal code', 'billing postal code', 'billing zip',
      // International
      'código postal', 'codigo postal', 'plz', 'postleitzahl', 'cap', 'cep', 'code postal',
    ],
    required: false,
  },
  {
    field: 'customerCountry',
    patterns: [
      'country', 'country name', 'nation', 'customer country', 'billing country',
      // International
      'país', 'pais', 'land', 'paese', 'pays',
    ],
    required: false,
  },
  {
    field: 'customerTaxId',
    patterns: [
      // Tax ID variations
      'tax id', 'tax_id', 'taxid', 'tax number', 'tax no', 'tax #',
      // VAT (Europe)
      'vat', 'vat number', 'vat no', 'vat #', 'vat_number', 'vatnumber',
      'vat id', 'vat registration', 'vat reg', 'vat reg no',
      // GST (AU/IN/NZ/SG)
      'gst', 'gst number', 'gst no', 'gst #', 'gst_number', 'gstnumber',
      'gst registration', 'gst reg', 'gst reg no', 'gstin', 'gst in',
      // ABN (Australia)
      'abn', 'abn number', 'australian business number',
      // EIN/TIN (US)
      'ein', 'ein number', 'tin', 'tin number', 'fein', 'federal ein',
      'taxpayer id', 'taxpayer identification',
      // PAN (India)
      'pan', 'pan number', 'pan no', 'pan card',
      // Customer specific
      'customer tax id', 'customer_tax_id', 'client tax id', 'client vat',
      'buyer tax id', 'buyer vat', 'buyer gst',
      // QuickBooks
      'tax id', 'resale no',
      // Xero
      'tax number',
      // International
      'nif', 'cif', 'rfc', 'cnpj', 'cpf', // Spain/Mexico/Brazil
      'ust-idnr', 'steuernummer', // German
      'partita iva', 'codice fiscale', // Italian
      'siret', 'siren', 'numéro tva', // French
    ],
    required: false,
  },

  // ============================================
  // LINE ITEM FIELDS
  // ============================================
  {
    field: 'description',
    patterns: [
      // Description variations
      'description', 'desc', 'desc.', 'item description', 'item_description',
      'line description', 'line_description',
      // Item/Product variations
      'item', 'item name', 'item_name', 'itemname',
      'product', 'product name', 'product_name', 'productname', 'prod name',
      'product description', 'product_description',
      // Service variations
      'service', 'service name', 'service_name', 'service description', 'service_description',
      // Details/Particulars
      'details', 'line details', 'particulars', 'line particulars',
      // Goods
      'goods', 'goods description', 'goods_description', 'goods name',
      // Material
      'material', 'material description', 'material_description', 'material name',
      // Name variations
      'name', 'line item', 'lineitem', 'line_item', 'line item name',
      // Work/Labor
      'work', 'work description', 'labor', 'labour', 'task', 'task description',
      // Memo (QuickBooks)
      'memo', 'line memo', 'item memo',
      // SKU (sometimes used as description)
      'sku', 'sku description',
      // QuickBooks
      'item', 'product/service', 'service/product', 'item description',
      // Xero
      'description', 'line description',
      // Zoho
      'item name', 'item details',
      // International
      'descripción', 'descripcion', 'beschreibung', 'bezeichnung', // Spanish/German
      'descrizione', 'descrição', 'description', // Italian/Portuguese/French
    ],
    required: true,
  },
  {
    field: 'quantity',
    patterns: [
      // Quantity variations
      'quantity', 'qty', 'qty.', 'qnty', 'quant', 'quantity ordered', 'quantity shipped',
      'quantity_ordered', 'quantity_shipped', 'ordered qty', 'shipped qty',
      // Units/Count
      'units', 'unit', 'count', 'cnt', 'pcs', 'pieces', 'nos', 'no of units',
      // Number/Amount (when referring to count)
      'no.', 'no', 'number', 'num', 'amount', 'amt',
      // Hours (for services)
      'hours', 'hrs', 'hour', 'time', 'duration',
      // QuickBooks
      'qty', 'quantity',
      // Xero
      'quantity', 'qty',
      // Zoho
      'quantity', 'qty',
      // International
      'cantidad', 'menge', 'quantità', 'quantité', 'quantidade', // Spanish/German/Italian/French/Portuguese
      'antal', 'aantal', // Nordic/Dutch
    ],
    required: false,
    dataTypeHints: ['numeric', 'positive integer'],
  },
  {
    field: 'unitPrice',
    patterns: [
      // Unit price variations
      'unit price', 'unit_price', 'unitprice', 'price', 'unit cost', 'unit_cost',
      'price per unit', 'price/unit', 'cost per unit', 'cost/unit',
      // Rate variations
      'rate', 'unit rate', 'unit_rate', 'hourly rate', 'hr rate', 'rate/hr',
      // Each/Per variations
      'each', 'per unit', 'per each', 'price each', 'cost each',
      // Single price
      'single price', 'item price', 'item cost', 'item_price', 'product price',
      'service rate', 'line rate',
      // Sales price
      'sales price', 'selling price', 'sell price', 'sale price',
      // QuickBooks
      'rate', 'price', 'sales price',
      // Xero
      'unit price', 'unit amount',
      // Zoho
      'rate', 'item price',
      // International
      'precio', 'precio unitario', 'preis', 'einzelpreis', 'stückpreis', // Spanish/German
      'prezzo', 'prezzo unitario', 'prix', 'prix unitaire', // Italian/French
      'preço', 'preço unitário', // Portuguese
    ],
    required: true,
  },
  {
    field: 'lineTotal',
    patterns: [
      // Total variations
      'total', 'line total', 'line_total', 'linetotal', 'item total', 'item_total',
      'row total', 'row_total', 'total price', 'total_price',
      // Amount variations
      'amount', 'amt', 'amt.', 'line amount', 'line_amount', 'lineamount',
      'item amount', 'item_amount', 'row amount',
      // Subtotal
      'subtotal', 'sub total', 'sub_total', 'sub-total', 'line subtotal',
      // Net variations
      'net', 'net amount', 'net_amount', 'net total', 'net value',
      // Extended
      'extended', 'extended price', 'extended_price', 'extended amount', 'ext price', 'ext amt',
      // Gross
      'gross', 'gross amount', 'gross_amount', 'gross total',
      // Sum
      'sum', 'line sum',
      // QuickBooks
      'amount', 'total',
      // Xero
      'line amount', 'amount',
      // Zoho
      'item total', 'amount',
      // International
      'total', 'importe', 'monto', 'betrag', 'summe', 'gesamt', // Spanish/German
      'totale', 'importo', 'montant', 'somme', // Italian/French
    ],
    required: false,
  },
  {
    field: 'taxRate',
    patterns: [
      // Tax rate variations
      'tax rate', 'tax_rate', 'taxrate', 'tax %', 'tax%', 'tax percent', 'tax percentage',
      // VAT rate
      'vat rate', 'vat_rate', 'vatrate', 'vat %', 'vat%', 'vat percent',
      // GST rate
      'gst rate', 'gst_rate', 'gstrate', 'gst %', 'gst%', 'gst percent',
      // Sales tax rate
      'sales tax rate', 'sales tax %', 'sales_tax_rate',
      // Tax class/code
      'tax class', 'tax code', 'tax_code', 'taxcode', 'tax type',
      // QuickBooks
      'tax rate', 'tax code',
      // Xero
      'tax rate', 'tax type',
      // International
      'tasa impuesto', 'iva %', 'iva', 'mwst', 'mwst %', 'mehrwertsteuer', // Spanish/German
      'aliquota iva', 'tva', 'taux tva', // Italian/French
    ],
    required: false,
  },
  {
    field: 'taxAmount',
    patterns: [
      // Tax amount variations
      'tax amount', 'tax_amount', 'taxamount', 'tax', 'tax total', 'tax value',
      'line tax', 'line_tax', 'item tax', 'item_tax', 'row tax',
      // VAT amount
      'vat amount', 'vat_amount', 'vatamount', 'vat', 'vat total',
      // GST amount
      'gst amount', 'gst_amount', 'gstamount', 'gst', 'gst total',
      // Sales tax
      'sales tax', 'sales_tax', 'salestax', 'sales tax amount',
      // Tax due
      'tax due', 'taxes', 'tax charges',
      // International
      'impuesto', 'iva', 'mwst', 'steuer', // Spanish/German
      'imposta', 'tasse', 'taxe', 'tva', // Italian/French
    ],
    required: false,
  },
  {
    field: 'discount',
    patterns: [
      // Discount variations
      'discount', 'disc', 'disc.', 'discnt', 'discount amount', 'discount_amount',
      'discount %', 'discount%', 'discount percent', 'discount percentage', 'discount_percent',
      // Line discount
      'line discount', 'line_discount', 'item discount', 'item_discount', 'row discount',
      // Rebate
      'rebate', 'rebate amount', 'rebate %',
      // Reduction
      'reduction', 'price reduction', 'markdown',
      // Allowance
      'allowance', 'allowances',
      // QuickBooks
      'discount', 'discount %',
      // Xero
      'discount', 'discount rate',
      // International
      'descuento', 'rabatt', 'rabat', // Spanish/German
      'sconto', 'remise', 'desconto', // Italian/French/Portuguese
    ],
    required: false,
  },
  {
    field: 'sku',
    patterns: [
      // SKU variations
      'sku', 'sku number', 'sku_number', 'skunumber', 'sku no', 'sku #', 'sku code',
      // Item code
      'item code', 'item_code', 'itemcode', 'item no', 'item #', 'item number',
      // Product code
      'product code', 'product_code', 'productcode', 'prod code', 'prod no', 'prod #',
      // Part number
      'part number', 'part_number', 'partnumber', 'part no', 'part #', 'p/n', 'pn',
      // Article number
      'article', 'article number', 'article_number', 'art no', 'art #', 'art. no',
      // Model number
      'model', 'model number', 'model_number', 'model no', 'model #',
      // Catalog number
      'catalog', 'catalog number', 'catalogue', 'cat no', 'cat #',
      // Reference
      'item ref', 'product ref', 'reference', 'ref',
      // UPC/EAN/Barcode
      'upc', 'ean', 'barcode', 'gtin',
      // HSN/SAC (Indian tax codes)
      'hsn', 'hsn code', 'hsn_code', 'sac', 'sac code', 'sac_code', 'hsn/sac',
      // QuickBooks
      'sku', 'item code',
      // Xero
      'code', 'item code',
      // International
      'código', 'codigo', 'artikelnummer', 'artikelnr', // Spanish/German
      'codice', 'código do produto', 'référence', // Italian/Portuguese/French
    ],
    required: false,
  },

  // ============================================
  // INVOICE TOTAL FIELDS
  // ============================================
  {
    field: 'invoiceSubtotal',
    patterns: [
      'subtotal', 'sub total', 'sub_total', 'sub-total',
      'net total', 'net_total', 'net amount', 'net',
      'items total', 'line items total', 'amount before tax',
      'total before tax', 'pretax total', 'pre-tax total',
    ],
    required: false,
  },
  {
    field: 'invoiceTax',
    patterns: [
      'total tax', 'total_tax', 'tax total', 'tax_total',
      'total vat', 'vat total', 'total gst', 'gst total',
      'invoice tax', 'taxes total', 'tax due',
    ],
    required: false,
  },
  {
    field: 'invoiceTotal',
    patterns: [
      'grand total', 'grand_total', 'grandtotal',
      'invoice total', 'invoice_total', 'invoicetotal',
      'total amount', 'total_amount', 'totalamount',
      'total due', 'total_due', 'amount due', 'amount_due',
      'balance due', 'balance_due', 'balance',
      'final total', 'final_total', 'final amount',
      'gross total', 'gross_total', 'gross amount',
      'amount payable', 'payable amount', 'payable',
      'total (usd)', 'total (eur)', 'total (gbp)', 'total (inr)', // Currency-specific
      'total incl tax', 'total including tax', 'total inc vat', 'total inc gst',
    ],
    required: false,
  },
  {
    field: 'amountPaid',
    patterns: [
      'amount paid', 'amount_paid', 'amountpaid', 'paid', 'paid amount',
      'payment', 'payment amount', 'payments', 'received', 'amount received',
      'deposit', 'deposits', 'advance', 'advance payment', 'prepaid',
    ],
    required: false,
  },

  // ============================================
  // ADDITIONAL FIELDS
  // ============================================
  {
    field: 'currency',
    patterns: [
      'currency', 'curr', 'cur', 'currency code', 'currency_code', 'currencycode',
      'ccy', 'money', 'payment currency',
      // International
      'moneda', 'währung', 'valuta', 'devise', 'moeda',
    ],
    required: false,
  },
  {
    field: 'status',
    patterns: [
      'status', 'invoice status', 'invoice_status', 'invoicestatus',
      'payment status', 'payment_status', 'paymentstatus',
      'state', 'invoice state', 'invoice_state',
      'paid status', 'billing status', 'order status',
      // Specific statuses as column names
      'paid', 'unpaid', 'overdue', 'draft', 'sent', 'pending',
      // International
      'estado', 'statut', 'zustand',
    ],
    required: false,
  },
  {
    field: 'notes',
    patterns: [
      'notes', 'note', 'memo', 'memos', 'comments', 'comment',
      'remarks', 'remark', 'additional notes', 'additional_notes',
      'invoice notes', 'invoice_notes', 'message', 'messages',
      'internal notes', 'customer notes', 'description notes',
      // International
      'notas', 'notizen', 'anmerkungen', 'note', 'remarques',
    ],
    required: false,
  },
  {
    field: 'terms',
    patterns: [
      'terms', 'payment terms', 'payment_terms', 'paymentterms',
      'terms and conditions', 'conditions', 'payment conditions',
      'net terms', 'credit terms',
      // International
      'términos', 'condiciones', 'bedingungen', 'zahlungsbedingungen',
      'termini', 'condizioni', 'conditions de paiement',
    ],
    required: false,
  },
  {
    field: 'poNumber',
    patterns: [
      // PO number variations
      'po number', 'po_number', 'ponumber', 'po no', 'po no.', 'po #', 'po',
      'p.o. number', 'p.o. no', 'p.o.', 'p.o',
      // Purchase order
      'purchase order', 'purchase order number', 'purchase_order', 'purchaseorder',
      'order number', 'order no', 'order #', 'order', 'order_number', 'ordernumber',
      // Customer PO
      'customer po', 'customer_po', 'cust po', 'client po', 'your po',
      'customer order', 'client order',
      // Reference
      'your ref', 'your reference', 'buyer ref', 'buyer reference',
      // SO number (related)
      'so number', 'so no', 'so #', 'sales order', 'sales_order',
      // QuickBooks
      'p.o. number', 'customer po',
      // Xero
      'reference', 'customer ref',
      // International
      'pedido', 'número pedido', 'bestellung', 'bestellnummer', // Spanish/German
      'ordine', 'numero ordine', 'commande', 'numéro commande', // Italian/French
    ],
    required: false,
  },

  // ============================================
  // IDENTIFICATION FIELDS (for multi-sheet)
  // ============================================
  {
    field: 'customerId',
    patterns: [
      'customer id', 'customer_id', 'customerid', 'cust id', 'cust_id', 'custid',
      'client id', 'client_id', 'clientid',
      'customer code', 'customer_code', 'cust code',
      'customer number', 'customer_number', 'cust no', 'cust #',
      'account id', 'account_id', 'acct id', 'account number', 'acct no',
      'contact id', 'contact_id',
    ],
    required: false,
  },
  {
    field: 'invoiceId',
    patterns: [
      'invoice id', 'invoice_id', 'invoiceid', 'inv id', 'inv_id', 'invid',
      'document id', 'doc id', 'doc_id', 'docid',
      'transaction id', 'trans id', 'trans_id', 'transid', 'txn id',
    ],
    required: false,
  },
  {
    field: 'lineItemId',
    patterns: [
      'line id', 'line_id', 'lineid', 'item id', 'item_id', 'itemid',
      'line number', 'line_number', 'line no', 'line #',
      'row id', 'row_id', 'rowid', 'row number', 'row no', 'row #',
      'detail id', 'detail_id', 'seq', 'sequence', 'seq no',
    ],
    required: false,
  },
];

/**
 * Get list of required fields
 */
export function getRequiredFields(): string[] {
  return FIELD_DEFINITIONS.filter((f) => f.required).map((f) => f.field);
}

/**
 * Get list of optional fields
 */
export function getOptionalFields(): string[] {
  return FIELD_DEFINITIONS.filter((f) => !f.required).map((f) => f.field);
}

/**
 * Get all field definitions for UI display
 */
export function getAllFieldDefinitions(): Array<{ field: string; required: boolean }> {
  return FIELD_DEFINITIONS.map((f) => ({ field: f.field, required: f.required }));
}

/**
 * Detect column mappings using fuzzy matching
 */
export function detectColumnMappings(
  headers: string[],
  sampleData: Record<string, unknown>[]
): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const usedFields = new Set<string>();

  // Normalize headers for matching
  const normalizedHeaders = headers.map((h) => ({
    original: h,
    normalized: normalizeHeader(h),
  }));

  // Build search index for all patterns
  const patternToField = new Map<string, string>();
  const allPatterns: Array<{ pattern: string; field: string; priority: number }> = [];

  for (const def of FIELD_DEFINITIONS) {
    def.patterns.forEach((pattern, index) => {
      patternToField.set(pattern.toLowerCase(), def.field);
      // Earlier patterns in the list have higher priority
      allPatterns.push({ pattern, field: def.field, priority: def.patterns.length - index });
    });
  }

  // Create Fuse instance for fuzzy matching
  const fuse = new Fuse(allPatterns, {
    keys: ['pattern'],
    threshold: 0.35, // Slightly increased for better fuzzy matching
    includeScore: true,
  });

  // Match each header
  for (const { original, normalized } of normalizedHeaders) {
    // First try exact match
    const exactMatch = patternToField.get(normalized);

    if (exactMatch && !usedFields.has(exactMatch)) {
      usedFields.add(exactMatch);
      mappings.push({
        sourceColumn: original,
        targetField: exactMatch,
        confidence: 100,
        sampleValues: getSampleValues(sampleData, original),
      });
      continue;
    }

    // Try fuzzy match
    const results = fuse.search(normalized);

    if (results.length > 0) {
      // Find best result that hasn't been used yet
      for (const result of results) {
        const { item, score } = result;
        const confidence = Math.round((1 - (score ?? 0)) * 100);

        if (confidence >= 65 && !usedFields.has(item.field)) {
          usedFields.add(item.field);
          mappings.push({
            sourceColumn: original,
            targetField: item.field,
            confidence,
            sampleValues: getSampleValues(sampleData, original),
          });
          break;
        }
      }
    }
  }

  // Also add unmapped columns with null target for user to map manually
  for (const { original } of normalizedHeaders) {
    const alreadyMapped = mappings.some((m) => m.sourceColumn === original);
    if (!alreadyMapped) {
      mappings.push({
        sourceColumn: original,
        targetField: null,
        confidence: 0,
        sampleValues: getSampleValues(sampleData, original),
      });
    }
  }

  return mappings;
}

/**
 * Normalize header for matching
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[_\-\.\/\\]/g, ' ')  // Replace separators with spaces
    .replace(/\s+/g, ' ')           // Collapse multiple spaces
    .replace(/[()[\]{}]/g, '')      // Remove brackets
    .trim();
}

/**
 * Get sample values from data for a column
 */
function getSampleValues(
  data: Record<string, unknown>[],
  column: string
): string[] {
  const values: string[] = [];
  const seen = new Set<string>();

  for (const row of data.slice(0, 10)) {
    const value = row[column];

    if (value !== undefined && value !== null && value !== '') {
      const strValue = String(value).trim();
      // Deduplicate and limit
      if (strValue && !seen.has(strValue) && values.length < 5) {
        seen.add(strValue);
        values.push(strValue);
      }
    }
  }

  return values;
}

/**
 * Detect format of the Excel data
 */
export type ExcelFormat =
  | 'flat_single_row'      // One row = one invoice with one item
  | 'flat_multi_row'       // Multiple rows = one invoice (grouped by invoice number)
  | 'multi_sheet';         // Separate sheets for customers, invoices, items

export function detectExcelFormat(
  sheets: string[],
  mappings: ColumnMapping[],
  sampleData: Record<string, unknown>[]
): ExcelFormat {
  // If multiple sheets with specific names, it's multi-sheet relational
  const sheetNamesLower = sheets.map(s => s.toLowerCase());
  const hasCustomerSheet = sheetNamesLower.some(s =>
    s.includes('customer') || s.includes('client') || s.includes('contact')
  );
  const hasInvoiceSheet = sheetNamesLower.some(s =>
    s.includes('invoice') || s.includes('bill') || s.includes('header')
  );
  const hasItemSheet = sheetNamesLower.some(s =>
    s.includes('item') || s.includes('line') || s.includes('detail')
  );

  if (sheets.length >= 2 && (hasCustomerSheet || (hasInvoiceSheet && hasItemSheet))) {
    return 'multi_sheet';
  }

  // Check if invoice numbers repeat (multi-row format)
  const invoiceNumMapping = mappings.find(m => m.targetField === 'invoiceNumber');
  if (invoiceNumMapping && sampleData.length >= 2) {
    const invoiceNumbers = sampleData.map(row => row[invoiceNumMapping.sourceColumn]);
    const uniqueNumbers = new Set(invoiceNumbers.filter(n => n !== undefined && n !== null));

    // If there are fewer unique invoice numbers than rows, it's multi-row
    if (uniqueNumbers.size < invoiceNumbers.length * 0.8) {
      return 'flat_multi_row';
    }
  }

  return 'flat_single_row';
}

/**
 * Detect relationships between sheets for multi-sheet format
 */
export interface SheetRelationship {
  fromSheet: string;
  fromColumn: string;
  toSheet: string;
  toColumn: string;
  confidence: number;
}

export function detectSheetRelationships(
  sheetData: Map<string, { headers: string[]; data: Record<string, unknown>[] }>
): SheetRelationship[] {
  const relationships: SheetRelationship[] = [];
  const sheets = Array.from(sheetData.keys());

  // Common foreign key patterns
  const foreignKeyPatterns = [
    { pattern: /customer[_\s]?id/i, relatesTo: /customer|client|contact/i },
    { pattern: /client[_\s]?id/i, relatesTo: /customer|client|contact/i },
    { pattern: /invoice[_\s]?id/i, relatesTo: /invoice|bill|header/i },
    { pattern: /inv[_\s]?id/i, relatesTo: /invoice|bill|header/i },
    { pattern: /order[_\s]?id/i, relatesTo: /order|header/i },
  ];

  for (let i = 0; i < sheets.length; i++) {
    for (let j = 0; j < sheets.length; j++) {
      if (i === j) continue;

      const fromSheet = sheets[i]!;
      const toSheet = sheets[j]!;
      const fromData = sheetData.get(fromSheet);
      const toData = sheetData.get(toSheet);

      if (!fromData || !toData) continue;

      // Check each column in fromSheet for potential foreign keys
      for (const fromCol of fromData.headers) {
        for (const { pattern, relatesTo } of foreignKeyPatterns) {
          if (pattern.test(fromCol) && relatesTo.test(toSheet)) {
            // Find matching column in toSheet (likely primary key)
            const toCol = toData.headers.find(h =>
              pattern.test(h) || /^id$/i.test(h) || h.toLowerCase() === fromCol.toLowerCase()
            );

            if (toCol) {
              // Verify relationship by checking value overlap
              const fromValues = new Set(
                fromData.data.map(r => String(r[fromCol] ?? '')).filter(v => v)
              );
              const toValues = new Set(
                toData.data.map(r => String(r[toCol] ?? '')).filter(v => v)
              );

              const overlap = [...fromValues].filter(v => toValues.has(v)).length;
              const confidence = Math.round((overlap / fromValues.size) * 100);

              if (confidence >= 50) {
                relationships.push({
                  fromSheet,
                  fromColumn: fromCol,
                  toSheet,
                  toColumn: toCol,
                  confidence,
                });
              }
            }
          }
        }
      }
    }
  }

  // Deduplicate and sort by confidence
  const seen = new Set<string>();
  return relationships
    .filter(r => {
      const key = `${r.fromSheet}:${r.fromColumn}->${r.toSheet}:${r.toColumn}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.confidence - a.confidence);
}
