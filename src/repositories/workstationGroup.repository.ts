import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  WorkstationGroup,
  CreateWorkstationGroupDTO,
  UpdateWorkstationGroupDTO,
} from "../models/workstationGroup.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `workstation_groups:${id}`,

  all: () => "workstation_groups:all",

  paginated: (page: number, limit: number) =>
    `workstation_groups:page:${page}:limit:${limit}`,

  listPattern: () => "workstation_groups:*",
};

const SELECT_COLUMNS = `
  id,
  name as "name"
`;

export class WorkstationGroupRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateWorkstationGroupDTO): Promise<WorkstationGroup> {
    const result = await pool.query<WorkstationGroup>(
      `
      INSERT INTO ${SCHEMA_UNICO}.workstation_groups
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

    const workstationGroup = result.rows[0];

    await Promise.all([
      cache.set(
        cacheKeys.byId(workstationGroup.id),
        workstationGroup,
        CACHE_TTL,
      ),
      this.invalidateListCache(),
    ]);

    return workstationGroup;
  }

  async findById(id: string): Promise<WorkstationGroup | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<WorkstationGroup>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<WorkstationGroup>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_UNICO}.workstation_groups
      WHERE id = $1
      `,
      [id],
    );

    const workstationGroup = result.rows[0];

    if (!workstationGroup) {
      return null;
    }

    await cache.set(cacheKey, workstationGroup, CACHE_TTL);

    return workstationGroup;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<WorkstationGroup>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<WorkstationGroup>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_UNICO}.workstation_groups
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
      pool.query<WorkstationGroup>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_UNICO}.workstation_groups
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<WorkstationGroup> = {
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
    dto: UpdateWorkstationGroupDTO,
  ): Promise<WorkstationGroup | null> {
    const result = await pool.query<WorkstationGroup>(
      `
      UPDATE ${SCHEMA_UNICO}.workstation_groups
      SET
        name = COALESCE($2, name)
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, dto.name ?? null],
    );

    const workstationGroup = result.rows[0];

    if (!workstationGroup) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), workstationGroup, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return workstationGroup;
  }

  async delete(id: string): Promise<WorkstationGroup | null> {
    const workstationGroup = await this.findById(id);

    if (!workstationGroup) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_UNICO}.workstation_groups
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return workstationGroup;
  }
}
