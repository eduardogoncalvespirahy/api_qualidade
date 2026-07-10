import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import { Form, CreateFormDTO, UpdateFormDTO } from "../models/form.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `forms:${id}`,

  all: () => "forms:all",

  paginated: (page: number, limit: number) =>
    `forms:page:${page}:limit:${limit}`,

  listPattern: () => "forms:*",
};

const SELECT_COLUMNS = `
  id,
  section_id as "sectionId",
  nome,
  descricao,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class FormRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateFormDTO): Promise<Form> {
    const result = await pool.query<Form>(
      `
      INSERT INTO ${SCHEMA_QUALIDADE}.forms
      (
        section_id,
        nome,
        descricao,
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
      [dto.sectionId, dto.nome, dto.descricao ?? null, dto.status ?? null],
    );

    const form = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(form.id), form, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return form;
  }

  async findById(id: string): Promise<Form | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<Form>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<Form>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.forms
      WHERE id = $1
      `,
      [id],
    );

    const form = result.rows[0];

    if (!form) {
      return null;
    }

    await cache.set(cacheKey, form, CACHE_TTL);

    return form;
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResult<Form>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<Form>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.forms
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
      pool.query<Form>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_QUALIDADE}.forms
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Form> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async update(id: string, dto: UpdateFormDTO): Promise<Form | null> {
    const result = await pool.query<Form>(
      `
      UPDATE ${SCHEMA_QUALIDADE}.forms
      SET
        section_id = COALESCE($2, section_id),
        nome = COALESCE($3, nome),
        descricao = COALESCE($4, descricao),
        status = COALESCE($5, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        id,
        dto.sectionId ?? null,
        dto.nome ?? null,
        dto.descricao ?? null,
        dto.status ?? null,
      ],
    );

    const form = result.rows[0];

    if (!form) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), form, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return form;
  }

  async delete(id: string): Promise<Form | null> {
    const form = await this.findById(id);

    if (!form) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_QUALIDADE}.forms
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return form;
  }
}
