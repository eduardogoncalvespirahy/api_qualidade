import { SyncLogRepository } from "../repositories/syncLog.repository";
import {
  SyncLogRecord,
  CreateSyncLogDTO
} from "../models/syncLog.model";
import { PaginatedResult } from "../models/paginate.model";

export class SyncLogService {
  private readonly repository: SyncLogRepository;

  constructor() {
    this.repository = new SyncLogRepository();
  }

  async create(dto: CreateSyncLogDTO): Promise<SyncLogRecord> {
    return this.repository.create(dto);
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<SyncLogRecord>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<SyncLogRecord> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("SyncLog não encontrado");
    }
    return item;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("SyncLog não encontrado");
    }
  }
}
