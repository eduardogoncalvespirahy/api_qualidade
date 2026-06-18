import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Workshift,
  CreateWorkshiftDTO,
  UpdateWorkshiftDTO,
} from "../models/workshift.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `workshifts:${id}`,

  all: () => "workshifts:all",

  paginated: (page: number, limit: number) =>
    `workshifts:page:${page}:limit:${limit}`,

  listPattern: () => "workshifts:*",
};

const SELECT_COLUMNS = `
  id,
  description as "description"
`;

export class WorkshiftRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateWorkshiftDTO): Promise<Workshift> {
    const result = await pool.query<Workshift>(
      `
      INSERT INTO teste.workshifts
      (
        id,
        description
      )
      VALUES
      (
        $1,
        $2
      )
      ON CONFLICT (id)
      DO UPDATE SET
        description = EXCLUDED.description
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.id, dto.description ?? null],
    );

    const workshift = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(workshift.id), workshift, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return workshift;
  }

  async findById(id: string): Promise<Workshift | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<Workshift>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<Workshift>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.workshifts
      WHERE id = $1
      `,
      [id],
    );

    const workshift = result.rows[0];

    if (!workshift) {
      return null;
    }

    await cache.set(cacheKey, workshift, CACHE_TTL);

    return workshift;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Workshift>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<Workshift>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.workshifts
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
      pool.query<Workshift>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.workshifts
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Workshift> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async update(id: string, dto: UpdateWorkshiftDTO): Promise<Workshift | null> {
    const result = await pool.query<Workshift>(
      `
      UPDATE teste.workshifts
      SET
        description = COALESCE($2, description)
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, dto.description ?? null],
    );

    const workshift = result.rows[0];

    if (!workshift) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), workshift, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return workshift;
  }

  async delete(id: string): Promise<Workshift | null> {
    const workshift = await this.findById(id);

    if (!workshift) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.workshifts
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return workshift;
  }
}
