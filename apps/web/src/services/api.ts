import type {
  UploadResponse,
  SessionResponse,
  ColumnDetectionResponse,
  ValidationResponse,
  GenerateResponse,
  JobStatusResponse,
  ApiResponse,
  SubmitMappingRequest,
  GenerationConfig,
} from '@excel-to-invoice/shared';

// In development, Vite proxy handles /api -> localhost:3001
// In production, use the full API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || '';
const BASE_URL = `${API_URL}/api`;

class ApiError extends Error {
  constructor(public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data: ApiResponse<T> = await response.json();

  if (!data.success || !response.ok) {
    throw new ApiError(
      data.error?.code ?? 'UNKNOWN_ERROR',
      data.error?.message ?? 'An error occurred',
      data.error?.details
    );
  }

  return data.data as T;
}

export const api = {
  /**
   * Upload Excel file
   */
  async upload(formData: FormData): Promise<UploadResponse> {
    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<UploadResponse>(response);
  },

  /**
   * Get session info
   */
  async getSession(sessionId: string): Promise<SessionResponse> {
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}`);
    return handleResponse<SessionResponse>(response);
  },

  /**
   * Get auto-detected column mappings
   */
  async getColumnMappings(sessionId: string): Promise<ColumnDetectionResponse> {
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}/columns`);
    return handleResponse<ColumnDetectionResponse>(response);
  },

  /**
   * Submit confirmed column mapping
   */
  async submitMapping(sessionId: string, data: SubmitMappingRequest): Promise<void> {
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}/map`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await handleResponse<void>(response);
  },

  /**
   * Run validation
   */
  async validate(sessionId: string): Promise<ValidationResponse> {
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}/validate`, {
      method: 'POST',
    });
    return handleResponse<ValidationResponse>(response);
  },

  /**
   * Save configuration
   */
  async saveConfig(sessionId: string, config: GenerationConfig): Promise<void> {
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    await handleResponse<void>(response);
  },

  /**
   * Start PDF generation
   */
  async generate(sessionId: string): Promise<GenerateResponse> {
    const response = await fetch(`${BASE_URL}/generate/${sessionId}`, {
      method: 'POST',
    });
    return handleResponse<GenerateResponse>(response);
  },

  /**
   * Get job status
   */
  async getJobStatus(sessionId: string, jobId: string): Promise<JobStatusResponse> {
    const response = await fetch(`${BASE_URL}/generate/${sessionId}/jobs/${jobId}`);
    return handleResponse<JobStatusResponse>(response);
  },

  /**
   * Get download URL
   */
  getDownloadUrl(sessionId: string): string {
    return `${BASE_URL}/generate/${sessionId}/download`;
  },

  /**
   * Get error report URL
   */
  getErrorReportUrl(sessionId: string): string {
    return `${BASE_URL}/generate/${sessionId}/errors`;
  },

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    await handleResponse<void>(response);
  },
};
