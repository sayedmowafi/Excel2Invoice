# Excel to Invoice

A web application that transforms Excel spreadsheets into professional PDF invoices in bulk. Perfect for businesses that need to convert invoice data from various sources (manual entry, accounting exports, ERP systems) into branded, professional PDF invoices.

## Features

- **Multi-format Excel Support**: Works with single-sheet files, multi-row invoices, and relational multi-sheet data (customers, invoices, line items)
- **Smart Column Detection**: Automatically detects and maps common column names from QuickBooks, Xero, Zoho, and other accounting software
- **4 Professional Templates**: Simple, Simple + Logo, Professional, and Tax Invoice templates
- **Dark Mode**: Full dark mode support for comfortable use
- **Paid/Unpaid Organization**: Generated PDFs are automatically organized into `paid/` and `unpaid/` folders
- **Real-time Progress**: WebSocket-based real-time progress updates during generation
- **Step Navigation**: Easy navigation between steps to make adjustments

## Screenshots

The application guides you through a simple workflow:

1. **Upload** - Drag and drop your Excel file
2. **Sheet Selection** - For multi-sheet files, identify which sheet contains what data
3. **Column Mapping** - Review and adjust auto-detected column mappings
4. **Validation** - See validation results and fix any issues
5. **Configuration** - Add your company info, logo, and customize settings
6. **Preview** - Preview invoices before generating
7. **Generate** - Watch real-time progress as PDFs are generated
8. **Download** - Download your ZIP file with organized paid/unpaid folders

## Supported Excel Formats

### Format A: Single Sheet (One Row = One Invoice)
```
| invoice_no | customer_name | item | qty | price | total |
|------------|---------------|------|-----|-------|-------|
| INV-001    | Acme Corp     | Widget | 2 | 50  | 100   |
```

### Format B: Single Sheet (Multiple Rows = One Invoice)
```
| invoice_no | customer_name | item    | qty | price |
|------------|---------------|---------|-----|-------|
| INV-001    | Acme Corp     | Widget  | 2   | 50    |
| INV-001    | Acme Corp     | Gadget  | 1   | 100   |
```

### Format C: Multi-Sheet Relational
```
Sheet: customers
| customer_id | name | email | company | address |

Sheet: invoices
| invoice_id | customer_id | issue_date | due_date | status |

Sheet: invoice_items
| invoice_id | description | qty | unit_price |
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **PDF Generation**: Puppeteer (headless Chrome)
- **Real-time Updates**: Socket.IO
- **Excel Parsing**: SheetJS (xlsx)

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sayedmowafi/Excel2Invoice.git
cd Excel2Invoice
```

2. Install dependencies:
```bash
npm install
```

3. Build the shared package:
```bash
npm run build -w @excel-to-invoice/shared
```

4. Start both servers (API + Web):
```bash
npm run dev
```

This will start:
- **API Server** on http://localhost:3001
- **Web App** on http://localhost:5173

5. Open http://localhost:5173 in your browser

### Alternative: Run Servers Separately

If you prefer to run the servers in separate terminals:

```bash
# Terminal 1 - API Server
npm run dev:api

# Terminal 2 - Web App
npm run dev:web
```

**Note:** Both servers must be running for PDF generation to work!

## Project Structure

```
excel-to-invoice/
├── apps/
│   ├── api/                 # Express backend
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── services/    # Business logic
│   │   │   │   ├── parser/  # Excel parsing
│   │   │   │   ├── mapper/  # Column detection
│   │   │   │   ├── validator/ # Data validation
│   │   │   │   └── generator/ # PDF generation
│   │   │   └── middleware/  # Express middleware
│   │   └── package.json
│   │
│   └── web/                 # React frontend
│       ├── src/
│       │   ├── components/  # UI components
│       │   ├── pages/       # Page components
│       │   ├── hooks/       # Custom hooks
│       │   └── services/    # API client
│       └── package.json
│
├── packages/
│   └── shared/              # Shared TypeScript types
│
└── package.json             # Monorepo root
```

## Environment Variables

### API (apps/api/.env)
```env
PORT=3001
NODE_ENV=development
```

### Web (apps/web/.env)
```env
VITE_API_URL=http://localhost:3001
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload Excel file |
| GET | `/api/sessions/:id` | Get session info |
| GET | `/api/sessions/:id/columns` | Get column mappings |
| POST | `/api/sessions/:id/map` | Submit column mappings |
| POST | `/api/sessions/:id/validate` | Run validation |
| POST | `/api/sessions/:id/config` | Save generation config |
| POST | `/api/generate/:sessionId` | Start PDF generation |
| GET | `/api/generate/:sessionId/download` | Download ZIP file |

## Configuration Options

- **Company Information**: Name, logo, address, phone, email, tax ID
- **Currency**: 50+ currency options with customizable symbol position
- **Date Format**: Multiple formats (DD/MM/YYYY, MM-DD-YYYY, etc.)
- **Number Format**: Decimal/thousands separators, decimal places
- **Field Visibility**: Toggle display of optional fields
- **Bank Details**: Add payment information to invoices

## License

This project is licensed under a custom non-commercial license.

**You are free to:**
- Share - copy and redistribute the material in any medium or format
- Adapt - remix, transform, and build upon the material

**Under the following terms:**
- **Attribution** - You must give appropriate credit
- **NonCommercial** - You may not use the material for commercial purposes

**For commercial use or licensing inquiries, please contact the author at: sayed@sayedmowafi.dev**

## Disclaimer

This software is provided for educational and personal use only. The author is not responsible for any misuse or damages arising from the use of this software.

## Contributing

This is a portfolio/educational project. Contributions, issues, and feature requests are welcome!

## Author

**Sayed Mowafi**
Email: sayed@sayedmowafi.dev

Created as a portfolio project demonstrating full-stack engineering capabilities.
