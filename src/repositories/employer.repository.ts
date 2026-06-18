import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Employer,
  CreateEmployerDTO,
  UpdateEmployerDTO,
} from "../models/employer.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `employers:${id}`,

  all: () => "employers:all",

  paginated: (page: number, limit: number) =>
    `employers:page:${page}:limit:${limit}`,

  listPattern: () => "employers:*",
};

const SELECT_COLUMNS = `
  id,
  trading_name as "tradingName"
`;

export class EmployerRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateEmployerDTO): Promise<Employer> {
    const result = await pool.query<Employer>(
      `
      INSERT INTO teste.employers
      (
        id,
        trading_name
      )
      VALUES
      (
        $1,
        $2
      )
      ON CONFLICT (id)
      DO UPDATE SET
        trading_name = EXCLUDED.trading_name
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.id, dto.tradingName ?? null],
    );

    const employer = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(employer.id), employer, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return employer;
  }

  async findById(id: string): Promise<Employer | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<Employer>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<Employer>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.employers
      WHERE id = $1
      `,
      [id],
    );

    const employer = result.rows[0];

    if (!employer) {
      return null;
    }

    await cache.set(cacheKey, employer, CACHE_TTL);

    return employer;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Employer>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<Employer>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.employers
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
      pool.query<Employer>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.employers
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Employer> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async update(id: string, dto: UpdateEmployerDTO): Promise<Employer | null> {
    const result = await pool.query<Employer>(
      `
      UPDATE teste.employers
      SET
        trading_name = COALESCE($2, trading_name)
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, dto.tradingName ?? null],
    );

    const employer = result.rows[0];

    if (!employer) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), employer, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return employer;
  }

  async delete(id: string): Promise<Employer | null> {
    const employer = await this.findById(id);

    if (!employer) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.employers
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return employer;
  }
}
