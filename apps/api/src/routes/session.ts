import { Router } from 'express';
import type {
  ApiResponse,
  SessionResponse,
  PreviewDataResponse,
  ColumnDetectionResponse,
  SubmitMappingRequest,
  ValidationResponse,
  ConfigRequest,
} from '@excel-to-invoice/shared';
import { generationConfigSchema } from '@excel-to-invoice/shared';
import { AppError } from '../middleware/errorHandler.js';
import { sessionStore } from '../services/sessionStore.js';
import { detectColumnMappings, getRequiredFields, getOptionalFields, type ExcelFormat } from '../services/mapper/columnMapper.js';
import { validateInvoices } from '../services/validator/invoiceValidator.js';
import { transformToInvoices } from '../services/parser/dataTransformer.js';

const router = Router();

/**
 * GET /api/sessions/:id
 * Get session information
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const session = sessionStore.get(id);

  if (!session) {
    throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found or expired');
  }

  // Remove internal fields
  const { filePath: _, ...publicSession } = session;

  const response: ApiResponse<SessionResponse> = {
    success: true,
    data: { session: publicSession },
  };

  res.json(response);
});

/**
 * GET /api/sessions/:id/preview
 * Get preview data for sheets
 */
router.get('/:id/preview', (req, res) => {
  const { id } = req.params;
  const session = sessionStore.get(id);

  if (!session) {
    throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found or expired');
  }

  const response: ApiResponse<PreviewDataResponse> = {
    success: true,
    data: {
      sheets: session.sheets.map((sheet) => ({
        name: sheet.name,
        headers: sheet.headers,
        rows: sheet.sampleData,
        totalRows: sheet.rowCount,
      })),
    },
  };

  res.json(response);
});

/**
 * GET /api/sessions/:id/columns
 * Get auto-detected column mappings for all sheets
 */
router.get('/:id/columns', (req, res) => {
  const { id } = req.params;
  const session = sessionStore.get(id);

  if (!session) {
    throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found or expired');
  }

  // Determine which sheets to process
  const sheetsToProcess = session.selectedSheets?.length
    ? session.sheets.filter(s => session.selectedSheets!.includes(s.name))
    : session.sheets;

  if (sheetsToProcess.length === 0) {
    throw new AppError(400, 'NO_SHEETS', 'No sheets found in session');
  }

  // Get mappings for each sheet
  const sheetMappings: Record<string, ReturnType<typeof detectColumnMappings>> = {};
  const allMappedFields = new Set<string | null>();

  for (const sheet of sheetsToProcess) {
    const sheetColumnMappings = detectColumnMappings(sheet.headers, sheet.sampleData);
    sheetMappings[sheet.name] = sheetColumnMappings;
    sheetColumnMappings.forEach(m => allMappedFields.add(m.targetField));
  }

  // For backward compatibility, also provide flat mappings from first/primary sheet
  const primarySheet = sheetsToProcess[0]!;
  const mappings = sheetMappings[primarySheet.name] ?? [];

  const response: ApiResponse<ColumnDetectionResponse> = {
    success: true,
    data: {
      mappings,
      sheetMappings, // New: mappings per sheet
      sheets: sheetsToProcess.map(s => ({
        name: s.name,
        headers: s.headers,
        rowCount: s.rowCount,
        sampleData: s.sampleData.slice(0, 3),
      })),
      unmappedColumns: primarySheet.headers.filter(
        (h) => !mappings.some((m) => m.sourceColumn === h)
      ),
      requiredFields: getRequiredFields().filter((f) => !allMappedFields.has(f)),
      optionalFields: getOptionalFields(),
      isMultiSheet: sheetsToProcess.length > 1,
    },
  };

  res.json(response);
});

/**
 * POST /api/sessions/:id/map
 * Submit confirmed column mapping
 */
router.post('/:id/map', (req, res) => {
  const { id } = req.params;
  const { mappings, sheetMode, selectedSheets } = req.body as SubmitMappingRequest;

  const session = sessionStore.get(id);

  if (!session) {
    throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found or expired');
  }

  // Convert simple mappings to full ColumnMapping objects
  // Preserve sheetName for multi-sheet mode
  const fullMappings = mappings.map((m) => ({
    sourceColumn: m.sourceColumn,
    targetField: m.targetField,
    confidence: 100, // User-confirmed
    sampleValues: [],
    sheetName: (m as { sheetName?: string }).sheetName,
  }));

  sessionStore.update(id, {
    columnMappings: fullMappings,
    sheetMode,
    selectedSheets,
    currentStep: 'mapping',
  });

  res.json({
    success: true,
    data: { message: 'Mappings saved successfully' },
  });
});

/**
 * POST /api/sessions/:id/validate
 * Run validation on the data
 */
router.post('/:id/validate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = sessionStore.get(id);

    if (!session) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found or expired');
    }

    if (!session.columnMappings || session.columnMappings.length === 0) {
      throw new AppError(400, 'NO_MAPPINGS', 'Column mappings must be submitted before validation');
    }

    // Determine Excel format based on sheet mode
    const format: ExcelFormat = session.sheetMode === 'multi'
      ? 'multi_sheet'
      : 'flat_single_row'; // Will auto-detect multi-row during transformation

    // Transform Excel data to invoices
    const { invoices, warnings } = await transformToInvoices(
      session.filePath,
      session.columnMappings,
      format,
      session.selectedSheets
    );

    // Validate invoices
    const validationResult = validateInvoices(invoices);

    // Add transformation warnings to validation result
    if (warnings.length > 0) {
      validationResult.errors.push(...warnings.map(w => ({
        severity: 'warning' as const,
        code: 'TRANSFORM_WARNING' as const,
        message: w,
        details: {},
      })));
    }

    // Calculate stats
    const stats = {
      total: invoices.length,
      valid: validationResult.validRows,
      warnings: validationResult.warningRows,
      errors: validationResult.errorRows,
    };

    // Update session
    sessionStore.updateInvoices(id, invoices, stats);
    sessionStore.updateStep(id, 'validation');

    const response: ApiResponse<ValidationResponse> = {
      success: true,
      data: {
        result: validationResult,
        invoices,
        stats,
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sessions/:id/config
 * Save generation configuration
 */
router.post('/:id/config', (req, res) => {
  const { id } = req.params;
  const { config } = req.body as ConfigRequest;

  console.log('Received config:', JSON.stringify(config, null, 2));

  const session = sessionStore.get(id);

  if (!session) {
    throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found or expired');
  }

  // Validate config
  const validatedConfig = generationConfigSchema.parse(config);

  sessionStore.updateConfig(id, validatedConfig);
  sessionStore.updateStep(id, 'config');

  res.json({
    success: true,
    data: { message: 'Configuration saved successfully' },
  });
});

/**
 * DELETE /api/sessions/:id
 * Delete session and cleanup files
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = sessionStore.get(id);

    if (!session) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found or expired');
    }

    // Delete uploaded file
    const fs = await import('fs/promises');
    await fs.unlink(session.filePath).catch(() => {});

    // Delete session
    sessionStore.delete(id);

    res.json({
      success: true,
      data: { message: 'Session deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
});

export { router as sessionRouter };
