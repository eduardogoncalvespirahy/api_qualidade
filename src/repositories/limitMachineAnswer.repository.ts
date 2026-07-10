import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  LimitMachineAnswer,
  CreateLimitMachineAnswerDTO,
  UpdateLimitMachineAnswerDTO,
} from "../models/limitMachineAnswer.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `limits-machine-answers:${id}`,

  all: () => "limits-machine-answers:all",

  paginated: (page: number, limit: number) =>
    `limits-machine-answers:page:${page}:limit:${limit}`,

  listPattern: () => "limits-machine-answers:*",
};

const SELECT_COLUMNS = `
  id,
  machine_id as "machineId",
  limit_max as "limitMax",
  limit_min as "limitMin",
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class LimitMachineAnswerRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateLimitMachineAnswerDTO): Promise<LimitMachineAnswer> {
    const result = await pool.query<LimitMachineAnswer>(
      `
      INSERT INTO ${SCHEMA_QUALIDADE}.limits_machine_answers
      (
        machine_id,
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
        dto.machineId,
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

  async findById(id: string): Promise<LimitMachineAnswer | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<LimitMachineAnswer>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<LimitMachineAnswer>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.limits_machine_answers
      WHERE id = $1
      `,
      [id],
    );

    const limitMachineAnswer = result.rows[0];

    if (!limitMachineAnswer) {
      return null;
    }

    await cache.set(cacheKey, limitMachineAnswer, CACHE_TTL);

    return limitMachineAnswer;
  }

  async findByAnswerId(answerId: string): Promise<LimitMachineAnswer[]> {
    const result = await pool.query<LimitMachineAnswer>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.limits_machine_answers
      WHERE machine_id = $1
      ORDER BY data_criacao DESC
      `,
      [answerId],
    );

    return result.rows;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<LimitMachineAnswer>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<LimitMachineAnswer>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.limits_machine_answers
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
      pool.query<LimitMachineAnswer>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_QUALIDADE}.limits_machine_answers
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<LimitMachineAnswer> = {
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
    dto: UpdateLimitMachineAnswerDTO,
  ): Promise<LimitMachineAnswer | null> {
    const result = await pool.query<LimitMachineAnswer>(
      `
      UPDATE ${SCHEMA_QUALIDADE}.limits_machine_answers
      SET
        machine_id = COALESCE($2, machine_id),
        limit_max = COALESCE($3, limit_max),
        limit_min = COALESCE($4, limit_min),
        status = COALESCE($5, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        id,
        dto.machineId ?? null,
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

  async delete(id: string): Promise<LimitMachineAnswer | null> {
    const limitAnswer = await this.findById(id);

    if (!limitAnswer) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_QUALIDADE}.limits_machine_answers
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
