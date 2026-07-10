import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  MachineAnswerResult,
  CreateMachineAnswerResultDTO,
  UpdateMachineAnswerResultDTO,
} from "../models/machineAnswerResult.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `machine-answer-result:${id}`,

  all: () => "machine-answer-result:all",

  paginated: (page: number, limit: number) =>
    `machine-answer-result:page:${page}:limit:${limit}`,

  byControl: (controlId: string) => `machine-answer-result:control:${controlId}`,

  paginatedByControl: (controlId: string, page: number, limit: number) =>
    `machine-answer-result:control:${controlId}:page:${page}:limit:${limit}`,

  listPattern: () => "machine-answer-result:*",
};

const SELECT_COLUMNS = `
  id,
  machine_id as "machineId",
  answer_id as "answerId",
  control_id as "controlId",
  resposta,
  limits_answer_id as "limitAnswerId",
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class MachineAnswerResultRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(
    dto: CreateMachineAnswerResultDTO,
  ): Promise<MachineAnswerResult> {
    const result = await pool.query<MachineAnswerResult>(
      `
      INSERT INTO ${SCHEMA_QUALIDADE}.machine_answer_result
      (
        machine_id,
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
        $4,
        $5
      )
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        dto.machineId,
        dto.answerId,
        dto.controlId,
        dto.resposta,
        dto.limitsAnswerId ?? null,
      ],
    );

    const machineAnswerResult = result.rows[0];

    await Promise.all([
      cache.set(
        cacheKeys.byId(machineAnswerResult.id),
        machineAnswerResult,
        CACHE_TTL,
      ),
      this.invalidateListCache(),
    ]);

    return machineAnswerResult;
  }

  async findById(id: string): Promise<MachineAnswerResult | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<MachineAnswerResult>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<MachineAnswerResult>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.machine_answer_result
      WHERE id = $1
      `,
      [id],
    );

    const machineAnswerResult = result.rows[0];

    if (!machineAnswerResult) {
      return null;
    }

    await cache.set(cacheKey, machineAnswerResult, CACHE_TTL);

    return machineAnswerResult;
  }

  async findByAnswerId(answerId: string): Promise<MachineAnswerResult[]> {
    const result = await pool.query<MachineAnswerResult>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.machine_answer_result
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
  ): Promise<PaginatedResult<MachineAnswerResult>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached =
      await cache.get<PaginatedResult<MachineAnswerResult>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.machine_answer_result
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
      pool.query<MachineAnswerResult>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_QUALIDADE}.machine_answer_result
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<MachineAnswerResult> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async findControlIdAll(
    controlId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<MachineAnswerResult>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginatedByControl(controlId, page, limit)
      : cacheKeys.byControl(controlId);

    const cached =
      await cache.get<PaginatedResult<MachineAnswerResult>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.machine_answer_result
      WHERE control_id = $1
      ORDER BY id DESC
    `;

    const params: unknown[] = [controlId];

 if (isPaginated) {
  query += ` LIMIT $2 OFFSET $3 `;
  params.push(limit, (page - 1) * limit);
}



    const [rowsResult, countResult] = await Promise.all([
      pool.query<MachineAnswerResult>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_QUALIDADE}.machine_answer_result
        WHERE control_id = $1
        `,
        [controlId],
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<MachineAnswerResult> = {
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
    dto: UpdateMachineAnswerResultDTO,
  ): Promise<MachineAnswerResult | null> {
    const result = await pool.query<MachineAnswerResult>(
      `
      UPDATE ${SCHEMA_QUALIDADE}.machine_answer_result
      SET
        machineid = COALESCE($2, machine_id),
        answer_id = COALESCE($3, answer_id),
        control_id = COALESCE($4, control_id),
        resposta = COALESCE($5, resposta),
        limits_answer_id = COALESCE($6, limits_answer_id)
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        id,
        dto.machineId ?? null,
        dto.answerId ?? null,
        dto.controlId ?? null,
        dto.resposta,
        dto.limitsAnswerId ?? null,
      ],
    );

    const machineAnswerResult = result.rows[0];

    if (!machineAnswerResult) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), machineAnswerResult, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return machineAnswerResult;
  }

  async delete(id: string): Promise<MachineAnswerResult | null> {
    const machineAnswerResult = await this.findById(id);

    if (!machineAnswerResult) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_QUALIDADE}.machine_answer_result
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return machineAnswerResult;
  }
}
