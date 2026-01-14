import puppeteer, { type Browser } from 'puppeteer';
import type { Invoice, GenerationConfig } from '@excel-to-invoice/shared';
import { renderTemplate } from '../templates/templateRenderer.js';

let browserInstance: Browser | null = null;

/**
 * Get or create browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        // Memory optimization for 512MB environments
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-component-extensions-with-background-pages',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-features=TranslateUI',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--no-first-run',
        '--password-store=basic',
        '--use-mock-keychain',
        '--single-process', // Important for low memory
        '--memory-pressure-off',
        '--max-old-space-size=256',
      ],
    });
  }
  return browserInstance;
}

/**
 * Generate PDF from invoice
 */
export async function generatePdf(
  invoice: Invoice,
  config: GenerationConfig
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Disable cache and reduce memory usage
    await page.setCacheEnabled(false);

    // Render HTML template
    const html = renderTemplate(invoice, config);

    // Set viewport to A4 dimensions (210mm x 297mm at 96dpi)
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });

    // Set content - use domcontentloaded for faster/less memory
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
    });

    // Generate PDF - use CSS page size
    const pdfBuffer = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
    // Force garbage collection hint
    if (global.gc) {
      global.gc();
    }
  }
}

/**
 * Close browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// Cleanup on process exit
process.on('exit', () => {
  closeBrowser();
});
