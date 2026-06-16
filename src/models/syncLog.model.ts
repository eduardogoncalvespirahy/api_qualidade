export interface SyncLogRecord {
  id: string;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  inserted: number;
  updated: number;
  removed: number;
  totalApi: number;
  totalBefore: number;
  success: boolean;
  error: string | null;
  createdAt: Date | null;
}

export interface CreateSyncLogDTO {
  startedAt: string | Date;
  finishedAt: string | Date;
  durationMs: number;
  inserted: number;
  updated: number;
  removed: number;
  totalApi: number;
  totalBefore: number;
  success: boolean;
  error?: string | null;
}
