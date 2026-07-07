import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  FormTime,
  CreateFormTimeDTO,
  UpdateFormTimeDTO,
} from "../models/formTime.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `formstime:${id}`,
  all: () => "formstime:all",
  paginated: (page: number, limit: number) => `formstime:page:${page}:limit:${limit}`,
  listPattern: () => "formstime:*",
};

// sem vírgula no final, e com id para o cache funcionar
const SELECT_COLUMNS = `
  id,
  form_id as "formId",
  tempo_execucao as "tempoExecucao",
  tempo_tolerencia as "tempoTolerancia",
  tempo_antecedencia as "tempoAntecependem"
`;

export class FormTimeRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateFormTimeDTO): Promise<FormTime> {
    const result = await pool.query<FormTime>(
      `
      INSERT INTO teste.form_time
      (
        form_id,
        tempo_execucao,
        tempo_tolerencia,
        tempo_antecedencia
      )
      VALUES ($1, $2, $3, $4)
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        dto.formId ?? null,
        dto.tempoExecucao,
        dto.tempoTolerancia ?? null,
        dto.tempoAntecependem ?? null,
      ],
    );

    const form = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId((form as any).id), form, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return form;
  }

  async findById(id: string): Promise<FormTime | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<FormTime>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<FormTime>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.form_time
      WHERE id = $1
      `,
      [id],
    );

    const form = result.rows[0];
    if (!form) return null;

    await cache.set(cacheKey, form, CACHE_TTL);
    return form;
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResult<FormTime>> {
    const isPaginated = page !== undefined && limit !== undefined && page > 0 && limit > 0;

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
      FROM teste.form_time
      ORDER BY form_id DESC
    `;

    const params: unknown[] = [];

    if (isPaginated) {
      query += ` LIMIT $1 OFFSET $2`;
      params.push(limit, (page - 1) * limit);
    }

    const [rowsResult, countResult] = await Promise.all([
      pool.query<FormTime>(query, params),
      pool.query<{ total: string }>(`SELECT COUNT(*) AS total FROM teste.form_time`),
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

  async update(id: string, dto: UpdateFormTimeDTO): Promise<FormTime | null> {
    const result = await pool.query<FormTime>(
      `
      UPDATE teste.form_time
      SET
        form_id            = COALESCE($2, form_id),
        tempo_execucao     = COALESCE($3, tempo_execucao),
        tempo_tolerencia   = COALESCE($4, tempo_tolerencia),
        tempo_antecedencia = COALESCE($5, tempo_antecedencia)
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        id,
        dto.formId ?? null,
        dto.tempoExecucao ?? null,
        dto.tempoTolerancia ?? null,
        dto.tempoAntecependem ?? null,
      ],
    );

    const form = result.rows[0];
    if (!form) return null;

    await Promise.all([
      cache.set(cacheKeys.byId(id), form, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return form;
  }

  async delete(id: string): Promise<FormTime | null> {
    const form = await this.findById(id);
    if (!form) return null;

    await pool.query(`DELETE FROM teste.form_time WHERE id = $1`, [id]);

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return form;
  }
}
