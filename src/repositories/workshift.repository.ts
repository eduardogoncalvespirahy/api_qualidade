import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Workshift,
  CreateWorkshiftDTO,
  UpdateWorkshiftDTO
} from "../models/workshift.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = (60 * 60) * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `workshifts:${id}`,
  paginated: (page: number, limit: number) => `workshifts:page:${page}:limit:${limit}`,
  paginatedPattern: () => "workshifts:page:*",
};

const SELECT_COLUMNS = `
  id,
  description as "description"
`;

export class WorkshiftRepository {
  async create(dto: CreateWorkshiftDTO): Promise<Workshift> {
    const result = await pool.query<Workshift>(
      `
      INSERT INTO teste.workshifts (id, description)
      VALUES ($1, $2)
      ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.id, dto.description ?? null]
    );

    const row = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(row.id), row, CACHE_TTL),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return row;
  }

  async findById(id: string): Promise<Workshift | null> {
    const key = cacheKeys.byId(id);

    const cached = await cache.get<Workshift>(key);
    if (cached) {
      console.log("Cache HIT workshifts:", id);
      return cached;
    }

    const result = await pool.query<Workshift>(
      `SELECT ${SELECT_COLUMNS} FROM teste.workshifts WHERE id = $1`,
      [id]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    await cache.set(key, row, CACHE_TTL);
    return row;
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Workshift>> {
    const cacheKey = cacheKeys.paginated(page, limit);

    const cached = await cache.get<PaginatedResult<Workshift>>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const offset = (page - 1) * limit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query<Workshift>(
        `
        SELECT ${SELECT_COLUMNS}
        FROM teste.workshifts
        ORDER BY id ASC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) as total FROM teste.workshifts`
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Workshift> = {
      data: rowsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cache.set(cacheKey, response, CACHE_TTL);
    return response;
  }

  async update(id: string, dto: UpdateWorkshiftDTO): Promise<Workshift | null> {
    const result = await pool.query<Workshift>(
      `
      UPDATE teste.workshifts
      SET description = COALESCE($2, description)
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, dto.description ?? null]
    );

    const row = result.rows[0] ?? null;
    if (!row) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), row, CACHE_TTL),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return row;
  }

  async delete(id: string): Promise<Workshift | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    await pool.query(`DELETE FROM teste.workshifts WHERE id = $1`, [id]);

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return existing;
  }
}
