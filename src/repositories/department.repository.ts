import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Department,
  CreateDepartmentDTO,
  UpdateDepartmentDTO
} from "../models/department.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = (60 * 60) * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `departments:${id}`,
  paginated: (page: number, limit: number) => `departments:page:${page}:limit:${limit}`,
  paginatedPattern: () => "departments:page:*",
};

const SELECT_COLUMNS = `
  id,
  name as "name"
`;

export class DepartmentRepository {
  async create(dto: CreateDepartmentDTO): Promise<Department> {
    const result = await pool.query<Department>(
      `
      INSERT INTO teste.departments (id, name)
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

  async findById(id: string): Promise<Department | null> {
    const key = cacheKeys.byId(id);

    const cached = await cache.get<Department>(key);
    if (cached) {
      console.log("Cache HIT departments:", id);
      return cached;
    }

    const result = await pool.query<Department>(
      `SELECT ${SELECT_COLUMNS} FROM teste.departments WHERE id = $1`,
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
  ): Promise<PaginatedResult<Department>> {
    const cacheKey = cacheKeys.paginated(page, limit);

    const cached = await cache.get<PaginatedResult<Department>>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const offset = (page - 1) * limit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query<Department>(
        `
        SELECT ${SELECT_COLUMNS}
        FROM teste.departments
        ORDER BY id ASC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) as total FROM teste.departments`
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Department> = {
      data: rowsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cache.set(cacheKey, response, CACHE_TTL);
    return response;
  }

  async update(id: string, dto: UpdateDepartmentDTO): Promise<Department | null> {
    const result = await pool.query<Department>(
      `
      UPDATE teste.departments
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

  async delete(id: string): Promise<Department | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    await pool.query(`DELETE FROM teste.departments WHERE id = $1`, [id]);

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return existing;
  }
}
