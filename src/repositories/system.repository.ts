import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  System,
  CreateSystemDTO,
  UpdateSystemDTO
} from "../models/system.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = (60 * 60) * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `systems:${id}`,
  paginated: (page: number, limit: number) => `systems:page:${page}:limit:${limit}`,
  paginatedPattern: () => "systems:page:*",
};

const SELECT_COLUMNS = `
  id,
  nome,
  descricao,
  url,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class SystemRepository {
  async create(dto: CreateSystemDTO): Promise<System> {
    const result = await pool.query<System>(
      `
      INSERT INTO teste.systems
        (nome, descricao, url, status)
      VALUES ($1, $2, $3, COALESCE($4, 1))
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.nome, dto.descricao ?? null, dto.url ?? null, dto.status ?? null]
    );

    const row = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(row.id), row, CACHE_TTL),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return row;
  }

  async findById(id: string): Promise<System | null> {
    const key = cacheKeys.byId(id);

    const cached = await cache.get<System>(key);
    if (cached) {
      console.log("Cache HIT systems:", id);
      return cached;
    }

    const result = await pool.query<System>(
      `SELECT ${SELECT_COLUMNS} FROM teste.systems WHERE id = $1`,
      [id]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    await cache.set(key, row, CACHE_TTL);
    return row;
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<System>> {
    const cacheKey = cacheKeys.paginated(page, limit);

    const cached = await cache.get<PaginatedResult<System>>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const offset = (page - 1) * limit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query<System>(
        `
        SELECT ${SELECT_COLUMNS}
        FROM teste.systems
        ORDER BY data_criacao DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) as total FROM teste.systems`
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<System> = {
      data: rowsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cache.set(cacheKey, response, CACHE_TTL);
    return response;
  }

  async update(id: string, dto: UpdateSystemDTO): Promise<System | null> {
    const result = await pool.query<System>(
      `
      UPDATE teste.systems
      SET
        nome = COALESCE($2, nome),
        descricao = COALESCE($3, descricao),
        url = COALESCE($4, url),
        status = COALESCE($5, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, dto.nome ?? null, dto.descricao ?? null, dto.url ?? null, dto.status ?? null]
    );

    const row = result.rows[0] ?? null;
    if (!row) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), row, CACHE_TTL),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return row;
  }

  async delete(id: string): Promise<System | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    await pool.query(`DELETE FROM teste.systems WHERE id = $1`, [id]);

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return existing;
  }
}
