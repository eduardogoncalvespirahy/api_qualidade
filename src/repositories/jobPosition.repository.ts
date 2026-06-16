import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  JobPosition,
  CreateJobPositionDTO,
  UpdateJobPositionDTO
} from "../models/jobPosition.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = (60 * 60) * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `job_positions:${id}`,
  paginated: (page: number, limit: number) => `job_positions:page:${page}:limit:${limit}`,
  paginatedPattern: () => "job_positions:page:*",
};

const SELECT_COLUMNS = `
  id,
  name as "name"
`;

export class JobPositionRepository {
  async create(dto: CreateJobPositionDTO): Promise<JobPosition> {
    const result = await pool.query<JobPosition>(
      `
      INSERT INTO teste.job_positions (id, name)
      VALUES ($1, $2)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.id, dto.name ?? null]
    );

    const row = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(row.id), row, CACHE_TTL),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return row;
  }

  async findById(id: string): Promise<JobPosition | null> {
    const key = cacheKeys.byId(id);

    const cached = await cache.get<JobPosition>(key);
    if (cached) {
      console.log("Cache HIT job_positions:", id);
      return cached;
    }

    const result = await pool.query<JobPosition>(
      `SELECT ${SELECT_COLUMNS} FROM teste.job_positions WHERE id = $1`,
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
  ): Promise<PaginatedResult<JobPosition>> {
    const cacheKey = cacheKeys.paginated(page, limit);

    const cached = await cache.get<PaginatedResult<JobPosition>>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const offset = (page - 1) * limit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query<JobPosition>(
        `
        SELECT ${SELECT_COLUMNS}
        FROM teste.job_positions
        ORDER BY id ASC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) as total FROM teste.job_positions`
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<JobPosition> = {
      data: rowsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cache.set(cacheKey, response, CACHE_TTL);
    return response;
  }

  async update(id: string, dto: UpdateJobPositionDTO): Promise<JobPosition | null> {
    const result = await pool.query<JobPosition>(
      `
      UPDATE teste.job_positions
      SET name = COALESCE($2, name)
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, dto.name ?? null]
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

  async delete(id: string): Promise<JobPosition | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    await pool.query(`DELETE FROM teste.job_positions WHERE id = $1`, [id]);

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return existing;
  }
}
