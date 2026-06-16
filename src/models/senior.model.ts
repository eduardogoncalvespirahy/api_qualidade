export interface SyncLog {
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;

  inserted: number;
  updated: number;
  removed: number;

  totalApi: number;
  totalMongoBefore: number;

  success: boolean;
  error?: string;
}

export interface EmployeeDocument {
  _id: string;

  companyNumber: number;

  registerNumber: number;

  person: {
    id: string;
    name: string;
  };

  hash: string;

  syncedAt: Date;
}

export interface EmployeeHash {
  _id: string;
  hash: string;
}