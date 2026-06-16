import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  WorkstationGroup,
  CreateWorkstationGroupDTO,
  UpdateWorkstationGroupDTO
} from "../models/workstationGroup.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = (60 * 60) * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `workstation_groups:${id}`,
  paginated: (page: number, limit: number) => `workstation_groups:page:${page}:limit:${limit}`,
  paginatedPattern: () => "workstation_groups:page:*",
};

const SELECT_COLUMNS = `
  id,
  name as "name"
`;

export class WorkstationGroupRepository {
  async create(dto: CreateWorkstationGroupDTO): Promise<WorkstationGroup> {
    const result = await pool.query<WorkstationGroup>(
      `
      INSERT INTO teste.workstation_groups (id, name)
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

  async findById(id: string): Promise<WorkstationGroup | null> {
    const key = cacheKeys.byId(id);

    const cached = await cache.get<WorkstationGroup>(key);
    if (cached) {
      console.log("Cache HIT workstation_groups:", id);
      return cached;
    }

    const result = await pool.query<WorkstationGroup>(
      `SELECT ${SELECT_COLUMNS} FROM teste.workstation_groups WHERE id = $1`,
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
  ): Promise<PaginatedResult<WorkstationGroup>> {
    const cacheKey = cacheKeys.paginated(page, limit);

    const cached = await cache.get<PaginatedResult<WorkstationGroup>>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const offset = (page - 1) * limit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query<WorkstationGroup>(
        `
        SELECT ${SELECT_COLUMNS}
        FROM teste.workstation_groups
        ORDER BY id ASC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) as total FROM teste.workstation_groups`
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<WorkstationGroup> = {
      data: rowsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cache.set(cacheKey, response, CACHE_TTL);
    return response;
  }

  async update(id: string, dto: UpdateWorkstationGroupDTO): Promise<WorkstationGroup | null> {
    const result = await pool.query<WorkstationGroup>(
      `
      UPDATE teste.workstation_groups
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

  async delete(id: string): Promise<WorkstationGroup | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    await pool.query(`DELETE FROM teste.workstation_groups WHERE id = $1`, [id]);

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return existing;
  }
}
