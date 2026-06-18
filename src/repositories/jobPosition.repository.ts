import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  JobPosition,
  CreateJobPositionDTO,
  UpdateJobPositionDTO,
} from "../models/jobPosition.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `job_positions:${id}`,

  all: () => "job_positions:all",

  paginated: (page: number, limit: number) =>
    `job_positions:page:${page}:limit:${limit}`,

  listPattern: () => "job_positions:*",
};

const SELECT_COLUMNS = `
  id,
  name as "name"
`;

export class JobPositionRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateJobPositionDTO): Promise<JobPosition> {
    const result = await pool.query<JobPosition>(
      `
      INSERT INTO teste.job_positions
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

    const jobPosition = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(jobPosition.id), jobPosition, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return jobPosition;
  }

  async findById(id: string): Promise<JobPosition | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<JobPosition>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<JobPosition>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.job_positions
      WHERE id = $1
      `,
      [id],
    );

    const jobPosition = result.rows[0];

    if (!jobPosition) {
      return null;
    }

    await cache.set(cacheKey, jobPosition, CACHE_TTL);

    return jobPosition;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<JobPosition>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<JobPosition>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.job_positions
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
      pool.query<JobPosition>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.job_positions
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<JobPosition> = {
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
    dto: UpdateJobPositionDTO,
  ): Promise<JobPosition | null> {
    const result = await pool.query<JobPosition>(
      `
      UPDATE teste.job_positions
      SET
        name = COALESCE($2, name)
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, dto.name ?? null],
    );

    const jobPosition = result.rows[0];

    if (!jobPosition) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), jobPosition, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return jobPosition;
  }

  async delete(id: string): Promise<JobPosition | null> {
    const jobPosition = await this.findById(id);

    if (!jobPosition) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.job_positions
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return jobPosition;
  }
}
