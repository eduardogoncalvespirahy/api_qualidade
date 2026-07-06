import { pool } from "../config/database";
import { Form, UpdateFormDTO } from "../models/form.model";
import { PaginatedResult } from "../models/paginate.model";
import {
  Status,
  CreateStatusDTO,
  UpdateStatusDTO,
} from "../models/status.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `status:${id}`,

  all: () => "status:all",

  paginated: (page: number, limit: number) =>
    `status:page:${page}:limit:${limit}`,

  listPattern: () => "status:*",
};

const SELECT_COLUMNS = `
  id,
  nome,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class StatusRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateStatusDTO): Promise<Status> {
    const result = await pool.query<Status>(
      `
      INSERT INTO teste.status
      (
        nome,
        status
      )
      VALUES
      (
        $1,
        COALESCE($2, 1)
      )
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.nome, dto.status ?? null],
    );

    const form = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(form.id), form, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return form;
  }

  async findById(id: string): Promise<Status | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<Status>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<Status>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.status
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

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Status>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<Status>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.status
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
      pool.query<Status>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.status
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Status> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async update(id: string, dto: UpdateStatusDTO): Promise<Status | null> {
    const result = await pool.query<Status>(
      `
      UPDATE teste.status
      SET
        nome = COALESCE($2, nome),
        status = COALESCE($3, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, dto.nome ?? null, dto.status ?? null],
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

  async delete(id: string): Promise<Status | null> {
    const form = await this.findById(id);

    if (!form) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.status
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
