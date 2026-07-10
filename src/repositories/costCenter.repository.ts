import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  CostCenter,
  CreateCostCenterDTO,
  UpdateCostCenterDTO,
} from "../models/costCenter.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `cost_centers:${id}`,

  all: () => "cost_centers:all",

  paginated: (page: number, limit: number) =>
    `cost_centers:page:${page}:limit:${limit}`,

  listPattern: () => "cost_centers:*",
};

const SELECT_COLUMNS = `
  id,
  name as "name"
`;

export class CostCenterRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateCostCenterDTO): Promise<CostCenter> {
    const result = await pool.query<CostCenter>(
      `
      INSERT INTO ${SCHEMA_UNICO}.cost_centers
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

    const costCenter = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(costCenter.id), costCenter, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return costCenter;
  }

  async findById(id: string): Promise<CostCenter | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<CostCenter>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<CostCenter>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_UNICO}.cost_centers
      WHERE id = $1
      `,
      [id],
    );

    const costCenter = result.rows[0];

    if (!costCenter) {
      return null;
    }

    await cache.set(cacheKey, costCenter, CACHE_TTL);

    return costCenter;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<CostCenter>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<CostCenter>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_UNICO}.cost_centers
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
      pool.query<CostCenter>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_UNICO}.cost_centers
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<CostCenter> = {
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
    dto: UpdateCostCenterDTO,
  ): Promise<CostCenter | null> {
    const result = await pool.query<CostCenter>(
      `
      UPDATE ${SCHEMA_UNICO}.cost_centers
      SET
        name = COALESCE($2, name)
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, dto.name ?? null],
    );

    const costCenter = result.rows[0];

    if (!costCenter) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), costCenter, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return costCenter;
  }

  async delete(id: string): Promise<CostCenter | null> {
    const costCenter = await this.findById(id);

    if (!costCenter) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_UNICO}.cost_centers
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return costCenter;
  }
}
