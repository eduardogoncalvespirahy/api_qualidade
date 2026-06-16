import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Employer,
  CreateEmployerDTO,
  UpdateEmployerDTO
} from "../models/employer.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = (60 * 60) * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `employers:${id}`,
  paginated: (page: number, limit: number) => `employers:page:${page}:limit:${limit}`,
  paginatedPattern: () => "employers:page:*",
};

const SELECT_COLUMNS = `
  id,
  trading_name as "tradingName"
`;

export class EmployerRepository {
  async create(dto: CreateEmployerDTO): Promise<Employer> {
    const result = await pool.query<Employer>(
      `
      INSERT INTO teste.employers (id, trading_name)
      VALUES ($1, $2)
      ON CONFLICT (id) DO UPDATE SET trading_name = EXCLUDED.trading_name
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.id, dto.tradingName ?? null]
    );

    const row = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(row.id), row, CACHE_TTL),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return row;
  }

  async findById(id: string): Promise<Employer | null> {
    const key = cacheKeys.byId(id);

    const cached = await cache.get<Employer>(key);
    if (cached) {
      console.log("Cache HIT employers:", id);
      return cached;
    }

    const result = await pool.query<Employer>(
      `SELECT ${SELECT_COLUMNS} FROM teste.employers WHERE id = $1`,
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
  ): Promise<PaginatedResult<Employer>> {
    const cacheKey = cacheKeys.paginated(page, limit);

    const cached = await cache.get<PaginatedResult<Employer>>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const offset = (page - 1) * limit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query<Employer>(
        `
        SELECT ${SELECT_COLUMNS}
        FROM teste.employers
        ORDER BY id ASC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) as total FROM teste.employers`
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Employer> = {
      data: rowsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cache.set(cacheKey, response, CACHE_TTL);
    return response;
  }

  async update(id: string, dto: UpdateEmployerDTO): Promise<Employer | null> {
    const result = await pool.query<Employer>(
      `
      UPDATE teste.employers
      SET trading_name = COALESCE($2, trading_name)
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, dto.tradingName ?? null]
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

  async delete(id: string): Promise<Employer | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    await pool.query(`DELETE FROM teste.employers WHERE id = $1`, [id]);

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return existing;
  }
}
