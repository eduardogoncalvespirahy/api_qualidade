import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  RepairerAnswerResult,
  CreateRepairerAnswerResultDTO,
  UpdateRepairerAnswerResultDTO,
} from "../models/repairerAnswerResult.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (answerResultId: string, userId: string) =>
    `repairer-answer-result:answerResultId:${answerResultId}:userId:${userId}`,

  byAnswerResultId: (answerResultId: string) =>
    `repairer-answer-result:answerResultId:${answerResultId}`,

  byUserId: (userId: string) => `repairer-answer-result:userId:${userId}`,

  all: () => "repairer-answer-result:all",

  paginated: (page: number, limit: number) =>
    `repairer-answer-result:page:${page}:limit:${limit}`,

  listPattern: () => "repairer-answer-result:*",
};

const SELECT_COLUMNS = `
  answer_result_id as "answerResultId",
  user_id as "userId",
  data_criacao as "dataCriacao"
`;

export class RepairerAnswerResultRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(
    dto: CreateRepairerAnswerResultDTO,
  ): Promise<RepairerAnswerResult> {
    const result = await pool.query<RepairerAnswerResult>(
      `
      INSERT INTO ${SCHEMA_QUALIDADE}.repairer_answer_result
      (
        answer_result_id,
        user_id
      )
      VALUES
      (
        $1,
        $2
      )
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.answerResultId, dto.userId],
    );

    const repairerAnswerResult = result.rows[0];

    await Promise.all([
      cache.set(
        cacheKeys.byId(
          repairerAnswerResult.answerResultId,
          repairerAnswerResult.userId,
        ),
        repairerAnswerResult,
        CACHE_TTL,
      ),
      cache.set(
        cacheKeys.byAnswerResultId(repairerAnswerResult.answerResultId),
        repairerAnswerResult,
        CACHE_TTL,
      ),
      cache.set(
        cacheKeys.byUserId(repairerAnswerResult.userId),
        repairerAnswerResult,
        CACHE_TTL,
      ),
      this.invalidateListCache(),
    ]);

    return repairerAnswerResult;
  }

  async findById(
    answerResultId: string,
    userId: string,
  ): Promise<RepairerAnswerResult | null> {
    const cacheKey = cacheKeys.byId(answerResultId, userId);

    const cached = await cache.get<RepairerAnswerResult>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<RepairerAnswerResult>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.repairer_answer_result
      WHERE answer_result_id = $1 and user_id = $2
      `,
      [answerResultId, userId],
    );

    const repairerAnswerResult = result.rows[0];

    if (!repairerAnswerResult) {
      return null;
    }

    await cache.set(cacheKey, repairerAnswerResult, CACHE_TTL);

    return repairerAnswerResult;
  }

  async findByAnswerResultId(
    answerResultId: string,
  ): Promise<RepairerAnswerResult | null> {
    const cacheKey = cacheKeys.byAnswerResultId(answerResultId);

    const cached = await cache.get<RepairerAnswerResult>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<RepairerAnswerResult>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.repairer_answer_result
      WHERE answer_result_id = $1
      `,
      [answerResultId],
    );

    const repairerAnswerResult = result.rows[0];

    if (!repairerAnswerResult) {
      return null;
    }

    await cache.set(cacheKey, repairerAnswerResult, CACHE_TTL);

    return repairerAnswerResult;
  }

  async findByUserId(userId: string): Promise<RepairerAnswerResult | null> {
    const cacheKey = cacheKeys.byUserId(userId);

    const cached = await cache.get<RepairerAnswerResult>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<RepairerAnswerResult>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.repairer_answer_result
      WHERE user_id = $1
      `,
      [userId],
    );

    const repairerAnswerResult = result.rows[0];

    if (!repairerAnswerResult) {
      return null;
    }

    await cache.set(cacheKey, repairerAnswerResult, CACHE_TTL);

    return repairerAnswerResult;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<RepairerAnswerResult>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached =
      await cache.get<PaginatedResult<RepairerAnswerResult>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.repairer_answer_result
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
      pool.query<RepairerAnswerResult>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_QUALIDADE}.repairer_answer_result
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<RepairerAnswerResult> = {
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
    answerResultId: string,
    userId: string,
    dto: UpdateRepairerAnswerResultDTO,
  ): Promise<RepairerAnswerResult | null> {
    const result = await pool.query<RepairerAnswerResult>(
      `
    UPDATE ${SCHEMA_QUALIDADE}.repairer_answer_result
    SET
        answer_result_id = COALESCE($3,answer_result_id),
        user_id = COALESCE($4,user_id),
        data_criacao = CURRENT_TIMESTAMP
    WHERE answer_result_id = $1 and user_id = $2
      RETURNING ${SELECT_COLUMNS}
      `,
      [answerResultId, userId, dto.answerResultId ?? null, dto.userId ?? null],
    );

    const RepairerAnswerResult = result.rows[0];

    if (!RepairerAnswerResult) {
      return null;
    }

    await Promise.all([
      cache.set(
        cacheKeys.byId(answerResultId, userId),
        RepairerAnswerResult,
        CACHE_TTL,
      ),
      cache.set(
        cacheKeys.byAnswerResultId(answerResultId),
        RepairerAnswerResult,
        CACHE_TTL,
      ),
      cache.set(cacheKeys.byUserId(userId), RepairerAnswerResult, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return RepairerAnswerResult;
  }

  async delete(
    answerResultId: string,
    userId: string,
  ): Promise<RepairerAnswerResult | null> {
    const RepairerAnswerResult = await this.findById(answerResultId, userId);

    if (!RepairerAnswerResult) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_QUALIDADE}.repairer_answer_result
      WHERE answer_result_id = $1 and user_id = $2
      `,
      [answerResultId, userId],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(answerResultId, userId)),
      cache.delete(cacheKeys.byAnswerResultId(answerResultId)),
      cache.delete(cacheKeys.byUserId(userId)),
      this.invalidateListCache(),
    ]);

    return RepairerAnswerResult;
  }
}
