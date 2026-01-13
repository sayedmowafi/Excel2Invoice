import type { ProcessingSession, SheetInfo, ColumnMapping, GenerationConfig, Invoice, ProcessingStats } from '@excel-to-invoice/shared';

interface SessionData {
  id: string;
  originalFileName: string;
  fileSize: number;
  filePath: string;
  sheets: SheetInfo[];
}

interface StoredSession extends ProcessingSession {
  filePath: string;
}

/**
 * In-memory session store
 * For production, this would be backed by Redis or MongoDB
 */
class SessionStore {
  private sessions: Map<string, StoredSession> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval (every 10 minutes)
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 10 * 60 * 1000);
  }

  /**
   * Create a new session
   */
  create(data: SessionData): StoredSession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

    const session: StoredSession = {
      id: data.id,
      uploadedAt: now,
      originalFileName: data.originalFileName,
      fileSize: data.fileSize,
      currentStep: 'upload',
      sheets: data.sheets,
      invoices: [],
      stats: {
        total: 0,
        valid: 0,
        warnings: 0,
        errors: 0,
      },
      expiresAt,
      filePath: data.filePath,
    };

    this.sessions.set(data.id, session);
    return session;
  }

  /**
   * Get a session by ID
   */
  get(id: string): StoredSession | undefined {
    const session = this.sessions.get(id);

    if (session && new Date() > session.expiresAt) {
      this.delete(id);
      return undefined;
    }

    return session;
  }

  /**
   * Update a session
   */
  update(id: string, updates: Partial<StoredSession>): StoredSession | undefined {
    const session = this.get(id);

    if (!session) {
      return undefined;
    }

    const updated = { ...session, ...updates };
    this.sessions.set(id, updated);
    return updated;
  }

  /**
   * Update session step
   */
  updateStep(id: string, step: ProcessingSession['currentStep']): StoredSession | undefined {
    return this.update(id, { currentStep: step });
  }

  /**
   * Update column mappings
   */
  updateMappings(id: string, mappings: ColumnMapping[]): StoredSession | undefined {
    return this.update(id, { columnMappings: mappings });
  }

  /**
   * Update configuration
   */
  updateConfig(id: string, config: GenerationConfig): StoredSession | undefined {
    return this.update(id, { config });
  }

  /**
   * Update invoices
   */
  updateInvoices(id: string, invoices: Invoice[], stats: ProcessingStats): StoredSession | undefined {
    return this.update(id, { invoices, stats });
  }

  /**
   * Delete a session
   */
  delete(id: string): boolean {
    return this.sessions.delete(id);
  }

  /**
   * Get file path for a session
   */
  getFilePath(id: string): string | undefined {
    return this.get(id)?.filePath;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpired(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [id, session] of this.sessions) {
      if (now > session.expiresAt) {
        this.sessions.delete(id);
        cleaned++;
      }
    }

    // Sessions cleaned up silently
  }

  /**
   * Stop the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export const sessionStore = new SessionStore();
