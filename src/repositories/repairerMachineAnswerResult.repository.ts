import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  RepairerMachineAnswerResult,
  CreateRepairerMachineAnswerResultDTO,
  UpdateRepairerMachineAnswerResultDTO,
} from "../models/repairerMachineAnswerResult.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (machineAnswerResultId: string, userId: string) =>
    `repairer-machine-answer-result:machineAnswerResultId:${machineAnswerResultId}:userId:${userId}`,

  byMachineAnswerResultId: (machineAnswerResultId: string) =>
    `repairer-machine-answer-result:machineAnswerResultId:${machineAnswerResultId}`,

  byUserId: (userId: string) =>
    `repairer-machine-answer-result:userId:${userId}`,

  all: () => "repairer-machine-answer-result:all",

  paginated: (page: number, limit: number) =>
    `repairer-machine-answer-result:page:${page}:limit:${limit}`,

  listPattern: () => "repairer-machine-answer-result:*",
};

const SELECT_COLUMNS = `
  machine_answer_result_id as "machineAnswerResultId",
  user_id as "userId",
  data_criacao as "dataCriacao",
  observacao
`;

export class RepairerMachineAnswerResultRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(
    dto: CreateRepairerMachineAnswerResultDTO,
  ): Promise<RepairerMachineAnswerResult> {
    const result = await pool.query<RepairerMachineAnswerResult>(
      `
      INSERT INTO ${SCHEMA_QUALIDADE}.repairer_machine_answer_result
      (
        machine_answer_result_id,
        user_id,
        observacao
      )
      VALUES
      (
        $1,
        $2,
        $3
      )
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.machineAnswerResultId, dto.userId, dto.observacao ?? null],
    );

    const repairerMachineAnswerResult = result.rows[0];

    await Promise.all([
      cache.set(
        cacheKeys.byId(
          repairerMachineAnswerResult.machineAnswerResultId,
          repairerMachineAnswerResult.userId,
        ),
        repairerMachineAnswerResult,
        CACHE_TTL,
      ),
      cache.set(
        cacheKeys.byMachineAnswerResultId(
          repairerMachineAnswerResult.machineAnswerResultId,
        ),
        repairerMachineAnswerResult,
        CACHE_TTL,
      ),
      cache.set(
        cacheKeys.byUserId(repairerMachineAnswerResult.userId),
        repairerMachineAnswerResult,
        CACHE_TTL,
      ),
      this.invalidateListCache(),
    ]);

    return repairerMachineAnswerResult;
  }

  async findById(
    machineAnswerResultId: string,
    userId: string,
  ): Promise<RepairerMachineAnswerResult | null> {
    const cacheKey = cacheKeys.byId(machineAnswerResultId, userId);

    const cached = await cache.get<RepairerMachineAnswerResult>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<RepairerMachineAnswerResult>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.repairer_machine_answer_result
      WHERE machine_answer_result_id = $1 and user_id = $2
      `,
      [machineAnswerResultId, userId],
    );

    const repairerMachineAnswerResult = result.rows[0];

    if (!repairerMachineAnswerResult) {
      return null;
    }

    await cache.set(cacheKey, repairerMachineAnswerResult, CACHE_TTL);

    return repairerMachineAnswerResult;
  }

  async findByMachineAnswerResultId(
    machineAnswerResultId: string,
  ): Promise<RepairerMachineAnswerResult | null> {
    const cacheKey = cacheKeys.byMachineAnswerResultId(machineAnswerResultId);

    const cached = await cache.get<RepairerMachineAnswerResult>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<RepairerMachineAnswerResult>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.repairer_machine_answer_result
      WHERE machine_answer_result_id = $1
      `,
      [machineAnswerResultId],
    );

    const repairerMachineAnswerResult = result.rows[0];

    if (!repairerMachineAnswerResult) {
      return null;
    }

    await cache.set(cacheKey, repairerMachineAnswerResult, CACHE_TTL);

    return repairerMachineAnswerResult;
  }

  async findByUserId(
    userId: string,
  ): Promise<RepairerMachineAnswerResult | null> {
    const cacheKey = cacheKeys.byUserId(userId);

    const cached = await cache.get<RepairerMachineAnswerResult>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<RepairerMachineAnswerResult>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.repairer_machine_answer_result
      WHERE user_id = $1
      `,
      [userId],
    );

    const repairerMachineAnswerResult = result.rows[0];

    if (!repairerMachineAnswerResult) {
      return null;
    }

    await cache.set(cacheKey, repairerMachineAnswerResult, CACHE_TTL);

    return repairerMachineAnswerResult;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<RepairerMachineAnswerResult>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached =
      await cache.get<PaginatedResult<RepairerMachineAnswerResult>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.repairer_machine_answer_result
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
      pool.query<RepairerMachineAnswerResult>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_QUALIDADE}.repairer_machine_answer_result
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<RepairerMachineAnswerResult> = {
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
    machineAnswerResultId: string,
    userId: string,
    dto: UpdateRepairerMachineAnswerResultDTO,
  ): Promise<RepairerMachineAnswerResult | null> {
    const result = await pool.query<RepairerMachineAnswerResult>(
      `
    UPDATE ${SCHEMA_QUALIDADE}.repairer_machine_answer_result
    SET
        machine_answer_result_id = COALESCE($3,machine_answer_result_id),
        user_id = COALESCE($4,user_id),
        data_criacao = CURRENT_TIMESTAMP,
        observacao = COALESCE($5,observacao)
    WHERE machine_answer_result_id = $1 and user_id = $2
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        machineAnswerResultId,
        userId,
        dto.machineAnswerResultId ?? null,
        dto.userId ?? null,
        dto.observacao ?? null,
      ],
    );

    const RepairerMachineAnswerResult = result.rows[0];

    if (!RepairerMachineAnswerResult) {
      return null;
    }

    await Promise.all([
      cache.set(
        cacheKeys.byId(machineAnswerResultId, userId),
        RepairerMachineAnswerResult,
        CACHE_TTL,
      ),
      cache.set(
        cacheKeys.byMachineAnswerResultId(machineAnswerResultId),
        RepairerMachineAnswerResult,
        CACHE_TTL,
      ),
      cache.set(
        cacheKeys.byUserId(userId),
        RepairerMachineAnswerResult,
        CACHE_TTL,
      ),
      this.invalidateListCache(),
    ]);

    return RepairerMachineAnswerResult;
  }

  async delete(
    machineAnswerResultId: string,
    userId: string,
  ): Promise<RepairerMachineAnswerResult | null> {
    const RepairerMachineAnswerResult = await this.findById(
      machineAnswerResultId,
      userId,
    );

    if (!RepairerMachineAnswerResult) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_QUALIDADE}.repairer_machine_answer_result
      WHERE machine_answer_result_id = $1 and user_id = $2
      `,
      [machineAnswerResultId, userId],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(machineAnswerResultId, userId)),
      cache.delete(cacheKeys.byMachineAnswerResultId(machineAnswerResultId)),
      cache.delete(cacheKeys.byUserId(userId)),
      this.invalidateListCache(),
    ]);

    return RepairerMachineAnswerResult;
  }
}
