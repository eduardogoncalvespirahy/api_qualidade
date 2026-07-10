import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  FormTime,
  CreateFormTimeDTO,
  UpdateFormTimeDTO,
} from "../models/formTime.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byformId: (formId: string) => `form_time:${formId}`,

  all: () => "form_time:all",

  paginated: (page: number, limit: number) =>
    `form_time:page:${page}:limit:${limit}`,

  listPattern: () => "form_time:*",
};

const SELECT_COLUMNS = `
  form_id            AS "formId",
  tempo_execucao     AS "tempoExecucao",
  tempo_tolerancia   AS "tempoTolerancia",
  tempo_antecedencia AS "tempoAntecedencia",
  data_criacao       AS "dataCriacao",
  data_alteracao     AS "dataAlteracao"
`;

export class FormTimeRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateFormTimeDTO): Promise<FormTime> {
    const result = await pool.query<FormTime>(
      `
      INSERT INTO ${SCHEMA_QUALIDADE}.form_time
      (
        form_id,
        tempo_execucao,
        tempo_tolerancia,
        tempo_antecedencia
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
      [
        dto.formId,
        dto.tempoExecucao,
        dto.tempoTolerancia ?? null,
        dto.tempoAntecedencia ?? null,
      ],
    );

    const formTime = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byformId(formTime.formId), formTime, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return formTime;
  }

  async findByformId(formId: string): Promise<FormTime | null> {
    const cacheKey = cacheKeys.byformId(formId);

    const cached = await cache.get<FormTime>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<FormTime>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.form_time
      WHERE form_id = $1
      `,
      [formId],
    );

    const formTime = result.rows[0];

    if (!formTime) {
      return null;
    }

    await cache.set(cacheKey, formTime, CACHE_TTL);

    return formTime;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<FormTime>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<FormTime>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.form_time
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
      pool.query<FormTime>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_QUALIDADE}.form_time
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<FormTime> = {
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
    formId: string,
    dto: UpdateFormTimeDTO,
  ): Promise<FormTime | null> {
    const result = await pool.query<FormTime>(
      `
      UPDATE ${SCHEMA_QUALIDADE}.form_time
      SET
        tempo_execucao = COALESCE($2, tempo_execucao),
        tempo_tolerancia = COALESCE($3, tempo_tolerancia),
        tempo_antecedencia = COALESCE($4, tempo_antecedencia),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE form_id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        formId,
        dto.tempoExecucao ?? null,
        dto.tempoTolerancia ?? null,
        dto.tempoAntecedencia ?? null,
      ],
    );

    const formTime = result.rows[0];

    if (!formTime) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byformId(formId), formTime, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return formTime;
  }

  async delete(formId: string): Promise<FormTime | null> {
    const formTime = await this.findByformId(formId);

    if (!formTime) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_QUALIDADE}.form_time
      WHERE form_id = $1
      `,
      [formId],
    );

    await Promise.all([
      cache.delete(cacheKeys.byformId(formId)),
      this.invalidateListCache(),
    ]);

    return formTime;
  }
}
