import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  CostCenter,
  CreateCostCenterDTO,
  UpdateCostCenterDTO
} from "../models/costCenter.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = (60 * 60) * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `cost_centers:${id}`,
  paginated: (page: number, limit: number) => `cost_centers:page:${page}:limit:${limit}`,
  paginatedPattern: () => "cost_centers:page:*",
};

const SELECT_COLUMNS = `
  id,
  name as "name"
`;

export class CostCenterRepository {
  async create(dto: CreateCostCenterDTO): Promise<CostCenter> {
    const result = await pool.query<CostCenter>(
      `
      INSERT INTO teste.cost_centers (id, name)
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

  async findById(id: string): Promise<CostCenter | null> {
    const key = cacheKeys.byId(id);

    const cached = await cache.get<CostCenter>(key);
    if (cached) {
      console.log("Cache HIT cost_centers:", id);
      return cached;
    }

    const result = await pool.query<CostCenter>(
      `SELECT ${SELECT_COLUMNS} FROM teste.cost_centers WHERE id = $1`,
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
  ): Promise<PaginatedResult<CostCenter>> {
    const cacheKey = cacheKeys.paginated(page, limit);

    const cached = await cache.get<PaginatedResult<CostCenter>>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const offset = (page - 1) * limit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query<CostCenter>(
        `
        SELECT ${SELECT_COLUMNS}
        FROM teste.cost_centers
        ORDER BY id ASC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) as total FROM teste.cost_centers`
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<CostCenter> = {
      data: rowsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cache.set(cacheKey, response, CACHE_TTL);
    return response;
  }

  async update(id: string, dto: UpdateCostCenterDTO): Promise<CostCenter | null> {
    const result = await pool.query<CostCenter>(
      `
      UPDATE teste.cost_centers
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

  async delete(id: string): Promise<CostCenter | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    await pool.query(`DELETE FROM teste.cost_centers WHERE id = $1`, [id]);

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return existing;
  }
}
