import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { nanoid } from 'nanoid';
import type { ApiResponse, UploadResponse } from '@excel-to-invoice/shared';
import { AppError } from '../middleware/errorHandler.js';
import { parseExcelFile } from '../services/parser/excelParser.js';
import { sessionStore } from '../services/sessionStore.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${nanoid()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'UNSUPPORTED_FORMAT', `Unsupported file format: ${ext}. Allowed: ${allowedExtensions.join(', ')}`));
    }
  },
});

/**
 * POST /api/upload
 * Upload an Excel file and create a new session
 */
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'NO_FILE', 'No file uploaded');
    }

    const { path: filePath, originalname, size } = req.file;

    // Parse Excel file
    const sheets = await parseExcelFile(filePath);

    if (sheets.length === 0) {
      throw new AppError(400, 'FILE_EMPTY', 'No sheets found in the Excel file');
    }

    // Create session
    const sessionId = nanoid();
    const session = sessionStore.create({
      id: sessionId,
      originalFileName: originalname,
      fileSize: size,
      filePath,
      sheets,
    });

    const response: ApiResponse<UploadResponse> = {
      success: true,
      data: {
        sessionId: session.id,
        fileName: originalname,
        fileSize: size,
        sheets: sheets.map((s) => ({
          name: s.name,
          rowCount: s.rowCount,
          columnCount: s.columnCount,
          headers: s.headers,
          sampleData: s.sampleData,
        })),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
});

export { router as uploadRouter };
