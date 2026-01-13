import type { NumberFormat, DateFormatOption } from '../types/config.js';

/**
 * Format a number according to the given format options
 */
export function formatNumber(
  value: number,
  format: NumberFormat
): string {
  const { decimalSeparator, thousandsSeparator, decimalPlaces } = format;

  // Round to decimal places
  const fixed = value.toFixed(decimalPlaces);

  // Split integer and decimal parts
  const [intPart, decPart] = fixed.split('.');

  // Add thousands separator
  const formattedInt = intPart?.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator) ?? '0';

  // Combine with decimal separator
  if (decimalPlaces > 0 && decPart) {
    return `${formattedInt}${decimalSeparator}${decPart}`;
  }

  return formattedInt;
}

/**
 * Format currency with symbol
 */
export function formatCurrency(
  value: number,
  symbol: string,
  position: 'before' | 'after',
  format: NumberFormat
): string {
  const formattedNumber = formatNumber(value, format);

  if (position === 'before') {
    return `${symbol}${formattedNumber}`;
  }

  return `${formattedNumber} ${symbol}`;
}

/**
 * Parse a date string or Date object to Date
 */
export function parseDate(value: string | Date): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // Try native Date parsing first
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Try common date formats manually
  // DD/MM/YYYY or DD-MM-YYYY
  const euMatch = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (euMatch) {
    const [, day, month, year] = euMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // DD MMM YYYY (e.g., 25 Dec 2024)
  const textMonthMatch = value.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (textMonthMatch) {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

/**
 * Format a date according to the given format
 */
export function formatDate(date: Date, format: DateFormatOption): string {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  const dayStr = day.toString().padStart(2, '0');
  const monthStr = (month + 1).toString().padStart(2, '0');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthShortNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  switch (format) {
    case 'DD/MM/YYYY':
      return `${dayStr}/${monthStr}/${year}`;
    case 'MM/DD/YYYY':
      return `${monthStr}/${dayStr}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${monthStr}-${dayStr}`;
    case 'DD MMM YYYY':
      return `${dayStr} ${monthShortNames[month]} ${year}`;
    case 'MMMM DD, YYYY':
      return `${monthNames[month]} ${dayStr}, ${year}`;
    default:
      return `${monthStr}/${dayStr}/${year}`;
  }
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Sanitize string for use in filenames
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 200);
}
