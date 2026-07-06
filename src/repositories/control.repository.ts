import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Control,
  CreateControlDTO,
  UpdateControlDTO,
} from "../models/control.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `controls:${id}`,

  all: () => "controls:all",

  paginated: (page: number, limit: number) =>
    `controls:page:${page}:limit:${limit}`,

  listPattern: () => "controls:*",
};

const SELECT_COLUMNS = `
  id,
  form_id as "formId",
  user_id as "userId",
  file_id as "fileId",
  observacao,
  data_emissao as "dataEmissao",
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class ControlRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateControlDTO): Promise<Control> {
    const result = await pool.query<Control>(
      `
      INSERT INTO teste.controls
      (
        form_id,
        user_id,
        file_id,
        observacao,
        data_criacao
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        COALESCE($5, CURRENT_TIMESTAMP)
      )
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.formId, dto.userId, dto.fileId, dto.observacao ?? null, dto.dataEmissao ?? null],
    );

    const control = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(control.id), control, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return control;
  }

  async findById(id: string): Promise<Control | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<Control>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<Control>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.controls
      WHERE id = $1
      `,
      [id],
    );

    const control = result.rows[0];

    if (!control) {
      return null;
    }

    await cache.set(cacheKey, control, CACHE_TTL);

    return control;
  }

  async findByFormId(formId: string): Promise<Control[]> {
    const result = await pool.query<Control>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.controls
      WHERE form_id = $1
      ORDER BY data_criacao DESC
      LIMIT 1
      `,
      [formId],
    );

    return result.rows;
  }

  async findByUserId(userId: string): Promise<Control[]> {
    const result = await pool.query<Control>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.controls
      WHERE user_id = $1
      ORDER BY data_criacao DESC
      `,
      [userId],
    );

    return result.rows;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Control>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<Control>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.controls
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
      pool.query<Control>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.controls
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Control> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async update(id: string, dto: UpdateControlDTO): Promise<Control | null> {
    const result = await pool.query<Control>(
      `
      UPDATE teste.controls
      SET
        form_id = COALESCE($2, form_id),
        user_id = COALESCE($3, user_id),
        file_id = COALESCE($4, file_id),
        observacao = COALESCE($5, observacao),
        data_criacao = COALESCE($6, data_criacao),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        id,
        dto.formId ?? null,
        dto.userId ?? null,
        dto.fileId ?? null,
        dto.observacao ?? null,
        dto.dataEmissao ?? null,
      ],
    );

    const control = result.rows[0];

    if (!control) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), control, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return control;
  }

  async delete(id: string): Promise<Control | null> {
    const control = await this.findById(id);

    if (!control) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.controls
      WHERE id = $1
      `, 
      
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return control;
  }
}
