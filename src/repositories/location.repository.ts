import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Location,
  CreateLocationDTO,
  UpdateLocationDTO
} from "../models/location.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = (60 * 60) * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `locations:${id}`,
  paginated: (page: number, limit: number) => `locations:page:${page}:limit:${limit}`,
  paginatedPattern: () => "locations:page:*",
};

const SELECT_COLUMNS = `
  id,
  employer_id as "employerId",
  nome,
  descricao,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class LocationRepository {
  async create(dto: CreateLocationDTO): Promise<Location> {
    const result = await pool.query<Location>(
      `
      INSERT INTO teste.locations
        (employer_id, nome, descricao, status)
      VALUES ($1, $2, $3, COALESCE($4, 1))
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.employerId, dto.nome, dto.descricao ?? null, dto.status ?? null]
    );

    const row = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(row.id), row, CACHE_TTL),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return row;
  }

  async findById(id: string): Promise<Location | null> {
    const key = cacheKeys.byId(id);

    const cached = await cache.get<Location>(key);
    if (cached) {
      console.log("Cache HIT locations:", id);
      return cached;
    }

    const result = await pool.query<Location>(
      `SELECT ${SELECT_COLUMNS} FROM teste.locations WHERE id = $1`,
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
  ): Promise<PaginatedResult<Location>> {
    const cacheKey = cacheKeys.paginated(page, limit);

    const cached = await cache.get<PaginatedResult<Location>>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const offset = (page - 1) * limit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query<Location>(
        `
        SELECT ${SELECT_COLUMNS}
        FROM teste.locations
        ORDER BY data_criacao DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) as total FROM teste.locations`
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Location> = {
      data: rowsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cache.set(cacheKey, response, CACHE_TTL);
    return response;
  }

  async update(id: string, dto: UpdateLocationDTO): Promise<Location | null> {
    const result = await pool.query<Location>(
      `
      UPDATE teste.locations
      SET
        employer_id = COALESCE($2, employer_id),
        nome = COALESCE($3, nome),
        descricao = COALESCE($4, descricao),
        status = COALESCE($5, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, dto.employerId ?? null, dto.nome ?? null, dto.descricao ?? null, dto.status ?? null]
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

  async delete(id: string): Promise<Location | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    await pool.query(`DELETE FROM teste.locations WHERE id = $1`, [id]);

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return existing;
  }
}
