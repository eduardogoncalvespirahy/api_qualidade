import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  LimitAnswer,
  CreateLimitAnswerDTO,
  UpdateLimitAnswerDTO,
} from "../models/limitAnswer.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `limits-answers:${id}`,

  all: () => "limits-answers:all",

  paginated: (page: number, limit: number) =>
    `limits-answers:page:${page}:limit:${limit}`,

  listPattern: () => "limits-answers:*",
};

const SELECT_COLUMNS = `
  id,
  answer_id as "answerId",
  limit_max as "limitMax",
  limit_min as "limitMin",
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class LimitAnswerRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateLimitAnswerDTO): Promise<LimitAnswer> {
    const result = await pool.query<LimitAnswer>(
      `
      INSERT INTO teste.limits_answers
      (
        answer_id,
        limit_max,
        limit_min,
        status
      )
      VALUES
      (
        $1,
        $2,
        $3,
        COALESCE($4, 1)
      )
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        dto.answerId,
        dto.limitMax ?? null,
        dto.limitMin ?? null,
        dto.status ?? null,
      ],
    );

    const limitAnswer = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(limitAnswer.id), limitAnswer, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return limitAnswer;
  }

  async findById(id: string): Promise<LimitAnswer | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<LimitAnswer>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<LimitAnswer>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.limits_answers
      WHERE id = $1
      `,
      [id],
    );

    const limitAnswer = result.rows[0];

    if (!limitAnswer) {
      return null;
    }

    await cache.set(cacheKey, limitAnswer, CACHE_TTL);

    return limitAnswer;
  }

  async findByAnswerId(answerId: string): Promise<LimitAnswer[]> {
    const result = await pool.query<LimitAnswer>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.limits_answers
      WHERE answer_id = $1
      ORDER BY data_criacao DESC
      `,
      [answerId],
    );

    return result.rows;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<LimitAnswer>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<LimitAnswer>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.limits_answers
      ORDER BY data_criacao DESC
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
      pool.query<LimitAnswer>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.limits_answers
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<LimitAnswer> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async findAllByAnswerId(
    answerId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<LimitAnswer>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<LimitAnswer>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.limits_answers
      WHERE answer_id = $1
      ORDER BY data_criacao DESC
    `;

    const params: unknown[] = [answerId];

    if (isPaginated) {
      query += `
        LIMIT $2
        OFFSET $3
      `;

      params.push(limit, (page - 1) * limit);
    }

    const [rowsResult, countResult] = await Promise.all([
      pool.query<LimitAnswer>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.limits_answers
        WHERE answer_id = $1
        `,
        [answerId],
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<LimitAnswer> = {
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
    dto: UpdateLimitAnswerDTO,
  ): Promise<LimitAnswer | null> {
    const result = await pool.query<LimitAnswer>(
      `
      UPDATE teste.limits_answers
      SET
        answer_id = COALESCE($2, answer_id),
        limit_max = COALESCE($3, limit_max),
        limit_min = COALESCE($4, limit_min),
        status = COALESCE($5, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        id,
        dto.answerId ?? null,
        dto.limitMax ?? null,
        dto.limitMin ?? null,
        dto.status ?? null,
      ],
    );

    const limitAnswer = result.rows[0];

    if (!limitAnswer) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), limitAnswer, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return limitAnswer;
  }

  async delete(id: string): Promise<LimitAnswer | null> {
    const limitAnswer = await this.findById(id);

    if (!limitAnswer) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.limits_answers
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return limitAnswer;
  }
}
