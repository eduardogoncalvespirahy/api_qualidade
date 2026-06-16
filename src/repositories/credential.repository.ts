import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Credential,
  CreateCredentialDTO
} from "../models/credential.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = (60 * 60) * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `credentials:${id}`,
  paginated: (page: number, limit: number) => `credentials:page:${page}:limit:${limit}`,
  paginatedPattern: () => "credentials:page:*",
};

const SELECT_COLUMNS = `
  id,
  user_id           as "userId",
  system_id         as "systemId",
  senha_hash        as "senhaHash",
  status,
  data_ultimo_login as "dataUltimoLogin",
  data_criacao      as "dataCriacao",
  data_alteracao    as "dataAlteracao"
`;

export class CredentialRepository {
  async create(
    dto: Omit<CreateCredentialDTO, "senha"> & { senhaHash: string }
  ): Promise<Credential> {
    const result = await pool.query<Credential>(
      `
      INSERT INTO teste.credentials
        (user_id, system_id, senha_hash, status)
      VALUES ($1, $2, $3, COALESCE($4, 1))
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.userId, dto.systemId, dto.senhaHash, dto.status ?? null]
    );

    const row = result.rows[0];
    await cache.deleteByPattern(cacheKeys.paginatedPattern());
    return row;
  }

  async findById(id: string): Promise<Credential | null> {
    const result = await pool.query<Credential>(
      `SELECT ${SELECT_COLUMNS} FROM teste.credentials WHERE id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findByUserId(userId: string): Promise<Credential[]> {
    const result = await pool.query<Credential>(
      `SELECT ${SELECT_COLUMNS} FROM teste.credentials WHERE user_id = $1`,
      [userId]
    );
    return result.rows;
  }

  async findByUserAndSystem(
    userId: string,
    systemId: string
  ): Promise<Credential | null> {
    const result = await pool.query<Credential>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.credentials
      WHERE user_id = $1 AND system_id = $2
      `,
      [userId, systemId]
    );
    return result.rows[0] ?? null;
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Credential>> {
    const offset = (page - 1) * limit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query<Credential>(
        `
        SELECT ${SELECT_COLUMNS}
        FROM teste.credentials
        ORDER BY data_criacao DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) as total FROM teste.credentials`
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    return {
      data: rowsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(
    id: string,
    fields: { senhaHash?: string; status?: number }
  ): Promise<Credential | null> {
    const result = await pool.query<Credential>(
      `
      UPDATE teste.credentials
      SET
        senha_hash = COALESCE($2, senha_hash),
        status = COALESCE($3, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, fields.senhaHash ?? null, fields.status ?? null]
    );

    const row = result.rows[0] ?? null;
    if (row) {
      await cache.deleteByPattern(cacheKeys.paginatedPattern());
    }
    return row;
  }

  async touchLastLogin(id: string): Promise<void> {
    await pool.query(
      `UPDATE teste.credentials SET data_ultimo_login = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );
  }

  async delete(id: string): Promise<Credential | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }
    await pool.query(`DELETE FROM teste.credentials WHERE id = $1`, [id]);
    await cache.deleteByPattern(cacheKeys.paginatedPattern());
    return existing;
  }
}
