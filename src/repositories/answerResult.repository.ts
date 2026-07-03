import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  AnswerResult,
  CreateAnswerResultDTO,
} from "../models/answerResult.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `answer-results:${id}`,

  all: () => "answer-results:all",

  paginated: (page: number, limit: number) =>
    `answer-results:page:${page}:limit:${limit}`,

  listPattern: () => "answer-results:*",
};

const SELECT_COLUMNS = `
  id,
  answer_id as "AnswerId",
  control_id as "controlId",
  resposta,
  limits_answer_id as "limitsAnswerId",
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class AnswerResultRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateAnswerResultDTO): Promise<AnswerResult> {
    const result = await pool.query<AnswerResult>(
      `
      INSERT INTO teste.answer_result
      (
        answer_id,
        control_id,
        resposta,
        limits_answer_id
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4
      )
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.AnswerId, dto.controlId, dto.resposta, dto.limitsAnswerId],
    );

    const answerResult = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(answerResult.id), answerResult, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return answerResult;
  }

  async findById(id: string): Promise<AnswerResult | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<AnswerResult>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<AnswerResult>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.answer_result
      WHERE id = $1
      `,
      [id],
    );

    const answerResult = result.rows[0];

    if (!answerResult) {
      return null;
    }

    await cache.set(cacheKey, answerResult, CACHE_TTL);

    return answerResult;
  }

  async findByAnswerId(answerId: string): Promise<AnswerResult[]> {
    const result = await pool.query<AnswerResult>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.answer_result
      WHERE answer_id = $1
      ORDER BY DATA_CRIACAO DESC LIMIT 1
      `,
      [answerId],
    );

    return result.rows;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<AnswerResult>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<AnswerResult>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.answer_result
      ORDER BY id DESC
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
      pool.query<AnswerResult>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.answer_result
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<AnswerResult> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async delete(id: string): Promise<AnswerResult | null> {
    const answerResult = await this.findById(id);

    if (!answerResult) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.answer_result
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return answerResult;
  }
}
