/**
 * Currency information
 */
export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
}

/**
 * Common currencies with their symbols and positions
 */
export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', symbolPosition: 'before' },
  { code: 'EUR', name: 'Euro', symbol: '\u20AC', symbolPosition: 'before' },
  { code: 'GBP', name: 'British Pound', symbol: '\u00A3', symbolPosition: 'before' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '\u00A5', symbolPosition: 'before' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '\u00A5', symbolPosition: 'before' },
  { code: 'INR', name: 'Indian Rupee', symbol: '\u20B9', symbolPosition: 'before' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', symbolPosition: 'before' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', symbolPosition: 'before' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', symbolPosition: 'before' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', symbolPosition: 'before' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', symbolPosition: 'before' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', symbolPosition: 'after' },
  { code: 'KRW', name: 'South Korean Won', symbol: '\u20A9', symbolPosition: 'before' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', symbolPosition: 'before' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', symbolPosition: 'before' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', symbolPosition: 'before' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', symbolPosition: 'before' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '\u20BD', symbolPosition: 'after' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', symbolPosition: 'before' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', symbolPosition: 'before' },
  { code: 'THB', name: 'Thai Baht', symbol: '\u0E3F', symbolPosition: 'before' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', symbolPosition: 'before' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', symbolPosition: 'before' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '\u20B1', symbolPosition: 'before' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'z\u0142', symbolPosition: 'after' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '\u20BA', symbolPosition: 'before' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'K\u010D', symbolPosition: 'after' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '\u20AA', symbolPosition: 'before' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', symbolPosition: 'before' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', symbolPosition: 'before' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', symbolPosition: 'before' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '\u20AB', symbolPosition: 'after' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E\u00A3', symbolPosition: 'before' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '\u20A6', symbolPosition: 'before' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs', symbolPosition: 'before' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '\u09F3', symbolPosition: 'before' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '\u20B4', symbolPosition: 'before' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', symbolPosition: 'after' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', symbolPosition: 'after' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', symbolPosition: 'after' },
];

/**
 * Get currency info by code
 */
export function getCurrencyInfo(code: string): CurrencyInfo | undefined {
  return CURRENCIES.find((c) => c.code === code);
}

/**
 * Get currency symbol by code
 */
export function getCurrencySymbol(code: string): string {
  return getCurrencyInfo(code)?.symbol ?? code;
}
