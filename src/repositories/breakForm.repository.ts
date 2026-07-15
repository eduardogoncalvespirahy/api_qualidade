import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  BreakForm,
  CreateBreakFormDTO,
  UpdateBreakFormDTO,
} from "../models/breakForm.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `break-forms:${id}`,

  all: () => "break-forms:all",

  paginated: (page: number, limit: number) =>
    `break-forms:page:${page}:limit:${limit}`,

  listPattern: () => "break-forms:*",
};

const SELECT_COLUMNS = `
  id,
  form_id as "formId",
  user_id as "userId",
  hora_inicio as "horaInicio",
  hora_fim as "horaFim",
  motivo,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class BreakFormRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateBreakFormDTO): Promise<BreakForm> {
    const result = await pool.query<BreakForm>(
      `
      INSERT INTO ${SCHEMA_QUALIDADE}.breaks_forms
      (
        form_id,
        user_id,
        hora_inicio,
        hora_fim,
        motivo,
        status
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        COALESCE($6, 1)
      )
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        dto.formId,
        dto.userId,
        dto.horaInicio,
        dto.horaFim,
        dto.motivo ?? null,
        dto.status ?? null,
      ],
    );

    const breakForm = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(breakForm.id), breakForm, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return breakForm;
  }

  async findById(id: string): Promise<BreakForm | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<BreakForm>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<BreakForm>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.breaks_forms
      WHERE id = $1
      `,
      [id],
    );

    const breakForm = result.rows[0];

    if (!breakForm) {
      return null;
    }

    await cache.set(cacheKey, breakForm, CACHE_TTL);

    return breakForm;
  }

  async findByFormId(formId: string): Promise<BreakForm[]> {
    const result = await pool.query<BreakForm>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.breaks_forms
      WHERE form_id = $1
      ORDER BY hora_inicio ASC
      `,
      [formId],
    );

    return result.rows;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<BreakForm>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<BreakForm>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.breaks_forms
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
      pool.query<BreakForm>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_QUALIDADE}.breaks_forms
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<BreakForm> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async update(id: string, dto: UpdateBreakFormDTO): Promise<BreakForm | null> {
    const result = await pool.query<BreakForm>(
      `
      UPDATE ${SCHEMA_QUALIDADE}.breaks_forms
      SET
        form_id = COALESCE($2, form_id),
        user_id = COALESCE($3, user_id),
        hora_inicio = COALESCE($4, hora_inicio),
        hora_fim = COALESCE($5, hora_fim),
        motivo = COALESCE($6, motivo),
        status = COALESCE($7, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        id,
        dto.formId ?? null,
        dto.userId ?? null,
        dto.horaInicio ?? null,
        dto.horaFim ?? null,
        dto.motivo ?? null,
        dto.status ?? null,
      ],
    );

    const breakForm = result.rows[0];

    if (!breakForm) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), breakForm, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return breakForm;
  }

  async delete(id: string): Promise<BreakForm | null> {
    const breakForm = await this.findById(id);

    if (!breakForm) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_QUALIDADE}.breaks_forms
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return breakForm;
  }
}
