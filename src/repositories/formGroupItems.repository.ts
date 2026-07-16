import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  formGroupItems,
  CreateFormGroupItemsDTO,
  UpdateFormGroupItemsDTO,
} from "../models/formGroupItems.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (formGroupId: string, formId: string) =>
    `form_group_items:form_group_id:${formGroupId}:form_id:${formId}`,

  byformGroupId: (formGroupId: string) =>
    `form_group_items:form_group_id:${formGroupId}`,

  byformId: (formId: string) => `form_group_items:form_id:${formId}`,

  all: () => "form_group_items:all",

  paginated: (page: number, limit: number) =>
    `form_group_items:page:${page}:limit:${limit}`,

  listPattern: () => "form_group_items:*",
};

const SELECT_COLUMNS = `
  form_group_id as "formGroupId",
  form_id as "formId",
  ordem
`;

export class FormGroupItemsRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateFormGroupItemsDTO): Promise<formGroupItems> {
    const result = await pool.query<formGroupItems>(
      `
      INSERT INTO ${SCHEMA_QUALIDADE}.form_group_items
      (
        form_group_id,
        form_id,
        ordem
      )
      VALUES
      (
        $1,
        $2,
        $3
      )
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.formGroupId ?? null, dto.formId ?? null, dto.ordem ?? null],
    );

    const formGroupItems = result.rows[0];

    await Promise.all([
      cache.set(
        cacheKeys.byId(formGroupItems.formGroupId, formGroupItems.formId),
        formGroupItems,
        CACHE_TTL,
      ),
      cache.set(
        cacheKeys.byformGroupId(formGroupItems.formGroupId),
        formGroupItems,
        CACHE_TTL,
      ),
      cache.set(
        cacheKeys.byformId(formGroupItems.formId),
        formGroupItems,
        CACHE_TTL,
      ),
      this.invalidateListCache(),
    ]);

    return formGroupItems;
  }

  async findById(
    formGroupId: string,
    formId: string,
  ): Promise<formGroupItems | null> {
    const cacheKey = cacheKeys.byId(formGroupId, formId);

    const cached = await cache.get<formGroupItems>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<formGroupItems>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.form_group_items
      WHERE form_group_id = $1 AND form_id = $2
      `,
      [formGroupId, formId],
    );

    const formGroupItems = result.rows[0];

    if (!formGroupItems) {
      return null;
    }

    await cache.set(cacheKey, formGroupItems, CACHE_TTL);

    return formGroupItems;
  }

  async findByformGroupId(id: string): Promise<formGroupItems | null> {
    const cacheKey = cacheKeys.byformGroupId(id);

    const cached = await cache.get<formGroupItems>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<formGroupItems>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.form_group_items
      WHERE form_group_id = $1
      `,
      [id],
    );

    const formGroupItems = result.rows[0];

    if (!formGroupItems) {
      return null;
    }

    await cache.set(cacheKey, formGroupItems, CACHE_TTL);

    return formGroupItems;
  }

  async findByformId(id: string): Promise<formGroupItems | null> {
    const cacheKey = cacheKeys.byformId(id);

    const cached = await cache.get<formGroupItems>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<formGroupItems>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.form_group_items
      WHERE form_id = $1
      `,
      [id],
    );

    const formGroupItems = result.rows[0];

    if (!formGroupItems) {
      return null;
    }

    await cache.set(cacheKey, formGroupItems, CACHE_TTL);

    return formGroupItems;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<formGroupItems>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<formGroupItems>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.form_group_items
      ORDER BY form_group_id ASC, form_id ASC, ordem ASC
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
      pool.query<formGroupItems>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_QUALIDADE}.form_group_items
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<formGroupItems> = {
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
    formGroupId: string,
    formId: string,
    dto: UpdateFormGroupItemsDTO,
  ): Promise<formGroupItems | null> {
    const result = await pool.query<formGroupItems>(
      `
      UPDATE ${SCHEMA_QUALIDADE}.form_group_items
      SET
        form_group_id = COALESCE($3, form_group_id),
        form_id = COALESCE($4, form_id),
        ordem = COALESCE($5, ordem)
      WHERE form_group_id = $1 AND form_id = $2
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        formGroupId,
        formId,
        dto.formGroupId ?? null,
        dto.formId ?? null,
        dto.ordem ?? null,
      ],
    );

    const formGroupItems = result.rows[0];

    if (!formGroupItems) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(formGroupId, formId), formGroupItems, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return formGroupItems;
  }

  async delete(
    formGroupId: string,
    formId: string,
  ): Promise<formGroupItems | null> {
    const formGroupItems = await this.findById(formGroupId, formId);

    if (!formGroupItems) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_QUALIDADE}.form_group_items
      WHERE form_group_id = $1 AND form_id = $2
      `,
      [formGroupId, formId],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(formGroupId, formId)),
      this.invalidateListCache(),
    ]);

    return formGroupItems;
  }
}
