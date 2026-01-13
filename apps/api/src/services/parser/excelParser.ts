import XLSX from 'xlsx';
import type { SheetInfo } from '@excel-to-invoice/shared';
import { AppError } from '../../middleware/errorHandler.js';

/**
 * Parse an Excel file and extract sheet information
 */
export async function parseExcelFile(filePath: string): Promise<SheetInfo[]> {
  try {
    // Read workbook
    const workbook = XLSX.readFile(filePath, {
      type: 'file',
      cellDates: true,
      cellNF: true,
      cellStyles: false,
    });

    const sheets: SheetInfo[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) continue;

      // Get range
      const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1');
      const rowCount = range.e.r - range.s.r; // Excluding header
      const columnCount = range.e.c - range.s.c + 1;

      // Convert to JSON to get headers and sample data
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: '',
        raw: false,
      });

      // Get headers (first row)
      const headers = jsonData.length > 0
        ? Object.keys(jsonData[0] ?? {})
        : getHeadersFromRange(worksheet, range);

      // Get sample data (first 5 rows)
      const sampleData = jsonData.slice(0, 5);

      sheets.push({
        name: sheetName,
        rowCount: Math.max(0, rowCount),
        columnCount,
        headers,
        sampleData,
      });
    }

    return sheets;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('password')) {
        throw new AppError(400, 'FILE_PASSWORD_PROTECTED', 'File is password protected. Please remove the password and try again.');
      }
      if (error.message.includes('Unsupported') || error.message.includes('invalid')) {
        throw new AppError(400, 'FILE_CORRUPT', 'File appears to be corrupt or invalid. Please try re-exporting from Excel.');
      }
    }
    throw new AppError(500, 'PARSE_ERROR', 'Failed to parse Excel file');
  }
}

/**
 * Get headers from worksheet range when no data rows exist
 */
function getHeadersFromRange(
  worksheet: XLSX.WorkSheet,
  range: XLSX.Range
): string[] {
  const headers: string[] = [];

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
    const cell = worksheet[cellAddress];
    headers.push(cell?.v?.toString() ?? `Column ${col + 1}`);
  }

  return headers;
}

/**
 * Read full data from a specific sheet
 */
export async function readSheetData(
  filePath: string,
  sheetName?: string
): Promise<Record<string, unknown>[]> {
  const workbook = XLSX.readFile(filePath, {
    type: 'file',
    cellDates: true,
    cellNF: true,
  });

  const targetSheet = sheetName ?? workbook.SheetNames[0];

  if (!targetSheet || !workbook.Sheets[targetSheet]) {
    throw new AppError(400, 'SHEET_NOT_FOUND', `Sheet "${sheetName}" not found`);
  }

  const worksheet = workbook.Sheets[targetSheet];

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: false,
  });
}

/**
 * Read data from multiple sheets
 */
export async function readMultipleSheets(
  filePath: string,
  sheetNames: string[]
): Promise<Map<string, Record<string, unknown>[]>> {
  const workbook = XLSX.readFile(filePath, {
    type: 'file',
    cellDates: true,
    cellNF: true,
  });

  const result = new Map<string, Record<string, unknown>[]>();

  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      throw new AppError(400, 'SHEET_NOT_FOUND', `Sheet "${sheetName}" not found`);
    }

    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
      raw: false,
    });

    result.set(sheetName, data);
  }

  return result;
}

/**
 * Detect headers from data array
 */
export function detectHeaders(data: Record<string, unknown>[]): string[] {
  if (data.length === 0) {
    return [];
  }

  // Get keys from the first row
  return Object.keys(data[0] ?? {});
}
