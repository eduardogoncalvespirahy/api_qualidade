import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  SyncLogRecord,
  CreateSyncLogDTO
} from "../models/syncLog.model";

const SELECT_COLUMNS = `
  id,
  started_at   as "startedAt",
  finished_at  as "finishedAt",
  duration_ms  as "durationMs",
  inserted,
  updated,
  removed,
  total_api    as "totalApi",
  total_before as "totalBefore",
  success,
  error,
  created_at   as "createdAt"
`;

export class SyncLogRepository {
  async create(dto: CreateSyncLogDTO): Promise<SyncLogRecord> {
    const result = await pool.query<SyncLogRecord>(
      `
      INSERT INTO teste.sync_logs
        (started_at, finished_at, duration_ms, inserted, updated,
         removed, total_api, total_before, success, error)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        dto.startedAt,
        dto.finishedAt,
        dto.durationMs,
        dto.inserted,
        dto.updated,
        dto.removed,
        dto.totalApi,
        dto.totalBefore,
        dto.success,
        dto.error ?? null,
      ]
    );

    return result.rows[0];
  }

  async findById(id: string): Promise<SyncLogRecord | null> {
    const result = await pool.query<SyncLogRecord>(
      `SELECT ${SELECT_COLUMNS} FROM teste.sync_logs WHERE id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<SyncLogRecord>> {
    const offset = (page - 1) * limit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query<SyncLogRecord>(
        `
        SELECT ${SELECT_COLUMNS}
        FROM teste.sync_logs
        ORDER BY started_at DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) as total FROM teste.sync_logs`
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    return {
      data: rowsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async delete(id: string): Promise<SyncLogRecord | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }
    await pool.query(`DELETE FROM teste.sync_logs WHERE id = $1`, [id]);
    return existing;
  }
}
