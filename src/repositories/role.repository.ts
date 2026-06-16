import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Role,
  CreateRoleDTO,
  UpdateRoleDTO
} from "../models/role.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = (60 * 60) * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `roles:${id}`,
  paginated: (page: number, limit: number) => `roles:page:${page}:limit:${limit}`,
  paginatedPattern: () => "roles:page:*",
};

const SELECT_COLUMNS = `
  id,
  system_id as "systemId",
  nome,
  descricao,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class RoleRepository {
  async create(dto: CreateRoleDTO): Promise<Role> {
    const result = await pool.query<Role>(
      `
      INSERT INTO teste.roles
        (system_id, nome, descricao, status)
      VALUES ($1, $2, $3, COALESCE($4, 1))
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.systemId, dto.nome, dto.descricao ?? null, dto.status ?? null]
    );

    const row = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(row.id), row, CACHE_TTL),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return row;
  }

  async findById(id: string): Promise<Role | null> {
    const key = cacheKeys.byId(id);

    const cached = await cache.get<Role>(key);
    if (cached) {
      console.log("Cache HIT roles:", id);
      return cached;
    }

    const result = await pool.query<Role>(
      `SELECT ${SELECT_COLUMNS} FROM teste.roles WHERE id = $1`,
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
  ): Promise<PaginatedResult<Role>> {
    const cacheKey = cacheKeys.paginated(page, limit);

    const cached = await cache.get<PaginatedResult<Role>>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const offset = (page - 1) * limit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query<Role>(
        `
        SELECT ${SELECT_COLUMNS}
        FROM teste.roles
        ORDER BY data_criacao DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) as total FROM teste.roles`
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Role> = {
      data: rowsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cache.set(cacheKey, response, CACHE_TTL);
    return response;
  }

  async update(id: string, dto: UpdateRoleDTO): Promise<Role | null> {
    const result = await pool.query<Role>(
      `
      UPDATE teste.roles
      SET
        system_id = COALESCE($2, system_id),
        nome = COALESCE($3, nome),
        descricao = COALESCE($4, descricao),
        status = COALESCE($5, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, dto.systemId ?? null, dto.nome ?? null, dto.descricao ?? null, dto.status ?? null]
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

  async delete(id: string): Promise<Role | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    await pool.query(`DELETE FROM teste.roles WHERE id = $1`, [id]);

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return existing;
  }
}
