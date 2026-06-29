import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  answerGroupItems,
  CreateAnswerGroupItemsDTO,
  UpdateAnswerGroupItemsDTO,
} from "../models/answerGroupItems.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (answerGroupId: string, answerId: string) =>
    `answer_group_items:answer_group_id:${answerGroupId}:answer_id:${answerId}`,

  byAnswerGroupId: (answerGroupId: string) =>
    `answer_group_items:answer_group_id:${answerGroupId}`,

  byAnswerId: (answerId: string) => `answer_group_items:answer_id:${answerId}`,

  all: () => "answer_group_items:all",

  paginated: (page: number, limit: number) =>
    `answer_group_items:page:${page}:limit:${limit}`,

  listPattern: () => "answer_group_items:*",
};

const SELECT_COLUMNS = `
  answer_group_id as "answerGroupId",
  answer_id as "answerId",
  ordem
`;

export class AnswerGroupItemsRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateAnswerGroupItemsDTO): Promise<answerGroupItems> {
    const result = await pool.query<answerGroupItems>(
      `
      INSERT INTO teste.answer_group_items
      (
        answer_group_id,
        answer_id,
        ordem
      )
      VALUES
      (
        $1,
        $2,
        $3
      )
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.answerGroupId ?? null, dto.answerId ?? null, dto.ordem ?? null],
    );

    const answerGroupItems = result.rows[0];

    await Promise.all([
      cache.set(
        cacheKeys.byId(
          answerGroupItems.answerGroupId,
          answerGroupItems.answerId,
        ),
        answerGroupItems,
        CACHE_TTL,
      ),
      cache.set(
        cacheKeys.byAnswerGroupId(answerGroupItems.answerGroupId),
        answerGroupItems,
        CACHE_TTL,
      ),
      cache.set(
        cacheKeys.byAnswerId(answerGroupItems.answerId),
        answerGroupItems,
        CACHE_TTL,
      ),
      this.invalidateListCache(),
    ]);

    return answerGroupItems;
  }

  async findById(
    answerGroupId: string,
    answerId: string,
  ): Promise<answerGroupItems | null> {
    const cacheKey = cacheKeys.byId(answerGroupId, answerId);

    const cached = await cache.get<answerGroupItems>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<answerGroupItems>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.answer_group_items
      WHERE answer_group_id = $1 AND answer_id = $2
      `,
      [answerGroupId, answerId],
    );

    const answerGroupItems = result.rows[0];

    if (!answerGroupItems) {
      return null;
    }

    await cache.set(cacheKey, answerGroupItems, CACHE_TTL);

    return answerGroupItems;
  }

  async findByAnswerGroupId(id: string): Promise<answerGroupItems | null> {
    const cacheKey = cacheKeys.byAnswerGroupId(id);

    const cached = await cache.get<answerGroupItems>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<answerGroupItems>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.answer_group_items
      WHERE answer_group_id = $1
      `,
      [id],
    );

    const answerGroupItems = result.rows[0];

    if (!answerGroupItems) {
      return null;
    }

    await cache.set(cacheKey, answerGroupItems, CACHE_TTL);

    return answerGroupItems;
  }

  async findByAnswerId(id: string): Promise<answerGroupItems | null> {
    const cacheKey = cacheKeys.byAnswerId(id);

    const cached = await cache.get<answerGroupItems>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<answerGroupItems>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.answer_group_items
      WHERE answer_id = $1
      `,
      [id],
    );

    const answerGroupItems = result.rows[0];

    if (!answerGroupItems) {
      return null;
    }

    await cache.set(cacheKey, answerGroupItems, CACHE_TTL);

    return answerGroupItems;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<answerGroupItems>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<answerGroupItems>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.answer_group_items
      ORDER BY answer_group_id ASC, answer_id ASC, ordem ASC
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
      pool.query<answerGroupItems>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.answer_group_items
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<answerGroupItems> = {
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
    answerGroupId: string,
    answerId: string,
    dto: UpdateAnswerGroupItemsDTO,
  ): Promise<answerGroupItems | null> {
    const result = await pool.query<answerGroupItems>(
      `
      UPDATE teste.answer_group_items
      SET
        answer_group_id = COALESCE($3, answer_group_id),
        answer_id = COALESCE($4, answer_id),
        ordem = COALESCE($5, ordem)
      WHERE answer_group_id = $1 AND answer_id = $2
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        answerGroupId,
        answerId,
        dto.answerGroupId ?? null,
        dto.answerId ?? null,
        dto.ordem ?? null,
      ],
    );

    const answerGroupItems = result.rows[0];

    if (!answerGroupItems) {
      return null;
    }

    await Promise.all([
      cache.set(
        cacheKeys.byId(answerGroupId, answerId),
        answerGroupItems,
        CACHE_TTL,
      ),
      this.invalidateListCache(),
    ]);

    return answerGroupItems;
  }

  async delete(
    answerGroupId: string,
    answerId: string,
  ): Promise<answerGroupItems | null> {
    const answerGroupItems = await this.findById(answerGroupId, answerId);

    if (!answerGroupItems) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.answer_group_items
      WHERE answer_group_id = $1 AND answer_id = $2
      `,
      [answerGroupId, answerId],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(answerGroupId, answerId)),
      this.invalidateListCache(),
    ]);

    return answerGroupItems;
  }
}
