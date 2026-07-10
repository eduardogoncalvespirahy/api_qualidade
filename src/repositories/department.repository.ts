import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Department,
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
} from "../models/department.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `departments:${id}`,

  all: () => "departments:all",

  paginated: (page: number, limit: number) =>
    `departments:page:${page}:limit:${limit}`,

  listPattern: () => "departments:*",
};

const SELECT_COLUMNS = `
  id,
  name as "name"
`;

export class DepartmentRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateDepartmentDTO): Promise<Department> {
    const result = await pool.query<Department>(
      `
      INSERT INTO ${SCHEMA_UNICO}.departments
      (
        id,
        name
      )
      VALUES
      (
        $1,
        $2
      )
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.id, dto.name ?? null],
    );

    const department = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(department.id), department, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return department;
  }

  async findById(id: string): Promise<Department | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<Department>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<Department>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_UNICO}.departments
      WHERE id = $1
      `,
      [id],
    );

    const department = result.rows[0];

    if (!department) {
      return null;
    }

    await cache.set(cacheKey, department, CACHE_TTL);

    return department;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Department>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<Department>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_UNICO}.departments
      ORDER BY id ASC
    `;

    const params: unknown[] = [];

    if (isPaginated) {
      query += `
        LIMIT $1
        OFFSET $2
      `;

      params.push(limit, (page - 1) * limit);
    }

    const [rowsResult, countResult] = await Promise.all([
      pool.query<Department>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_UNICO}.departments
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Department> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async update(
    id: string,
    dto: UpdateDepartmentDTO,
  ): Promise<Department | null> {
    const result = await pool.query<Department>(
      `
      UPDATE ${SCHEMA_UNICO}.departments
      SET
        name = COALESCE($2, name)
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, dto.name ?? null],
    );

    const department = result.rows[0];

    if (!department) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), department, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return department;
  }

  async delete(id: string): Promise<Department | null> {
    const department = await this.findById(id);

    if (!department) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_UNICO}.departments
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return department;
  }
}
