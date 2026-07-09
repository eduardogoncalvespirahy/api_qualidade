import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  FormDraft,
  CreateFormDraftDTO,
  UpdateFormDraftDTO,
} from "../models/formDraft.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `form-drafts:${id}`,

  all: () => "form-drafts:all",

  paginated: (page: number, limit: number) =>
    `form-drafts:page:${page}:limit:${limit}`,

  listPattern: () => "form-drafts:*",
};

const SELECT_COLUMNS = `
  form_id as "formId",
  rascunho_data as "rascunhoData"
`;

export class FormDraftRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateFormDraftDTO): Promise<FormDraft> {
    const result = await pool.query<FormDraft>(
      `
      INSERT INTO teste.form_draft
      (
        form_id,
        rascunho_data
      )
      VALUES
      (
        $1,
        $2
      )
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.formId, dto.rascunhoData],
    );

    const formDraft = result.rows[0];
    console.log("Criado category: ", formDraft);

    await Promise.all([
      cache.set(cacheKeys.byId(formDraft.formId), formDraft, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return formDraft;
  }

  async findById(id: string): Promise<FormDraft | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<FormDraft>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<FormDraft>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.form_draft
      WHERE form_id = $1
      `,
      [id],
    );

    const formDraft = result.rows[0];

    if (!formDraft) {
      return null;
    }

    await cache.set(cacheKey, formDraft, CACHE_TTL);

    return formDraft;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<FormDraft>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<FormDraft>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.form_draft
      ORDER BY form_id DESC
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
      pool.query<FormDraft>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.form_draft
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<FormDraft> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async update(id: string, dto: UpdateFormDraftDTO): Promise<FormDraft | null> {
    const result = await pool.query<FormDraft>(
      `
    UPDATE teste.form_draft
    SET
    rascunho_data = $2
    WHERE form_id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.formId ?? null, dto.rascunhoData ?? null],
    );

    const FormDraft = result.rows[0];

    if (!FormDraft) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), FormDraft, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return FormDraft;
  }

  async delete(id: string): Promise<FormDraft | null> {
    const FormDraft = await this.findById(id);

    if (!FormDraft) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.form_draft
      WHERE form_id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return FormDraft;
  }
}
