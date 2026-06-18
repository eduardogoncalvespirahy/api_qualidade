import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import { Credential, CreateCredentialDTO } from "../models/credential.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `credentials:${id}`,

  all: () => "credentials:all",

  paginated: (page: number, limit: number) =>
    `credentials:page:${page}:limit:${limit}`,

  listPattern: () => "credentials:*",
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
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(
    dto: Omit<CreateCredentialDTO, "senha"> & { senhaHash: string },
  ): Promise<Credential> {
    const result = await pool.query<Credential>(
      `
      INSERT INTO teste.credentials
      (
        user_id,
        system_id,
        senha_hash,
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
      [dto.userId, dto.systemId, dto.senhaHash, dto.status ?? null],
    );

    const credential = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(credential.id), credential, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return credential;
  }

  async findById(id: string): Promise<Credential | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<Credential>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<Credential>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.credentials
      WHERE id = $1
      `,
      [id],
    );

    const credential = result.rows[0];

    if (!credential) {
      return null;
    }

    await cache.set(cacheKey, credential, CACHE_TTL);

    return credential;
  }

  async findByUserId(userId: string): Promise<Credential[]> {
    const result = await pool.query<Credential>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.credentials
      WHERE user_id = $1
      ORDER BY data_criacao DESC
      `,
      [userId],
    );

    return result.rows;
  }

  async findByUserAndSystem(
    userId: string,
    systemId: string,
  ): Promise<Credential | null> {
    const result = await pool.query<Credential>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.credentials
      WHERE user_id = $1
      AND system_id = $2
      `,
      [userId, systemId],
    );

    return result.rows[0] ?? null;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Credential>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<Credential>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.credentials
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
      pool.query<Credential>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.credentials
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Credential> = {
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
    id: string,
    fields: {
      senhaHash?: string;
      status?: number;
    },
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
      [id, fields.senhaHash ?? null, fields.status ?? null],
    );

    const credential = result.rows[0];

    if (!credential) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), credential, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return credential;
  }

  async touchLastLogin(id: string): Promise<void> {
    await pool.query(
      `
      UPDATE teste.credentials
      SET data_ultimo_login = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [id],
    );

    await cache.delete(cacheKeys.byId(id));
  }

  async delete(id: string): Promise<Credential | null> {
    const credential = await this.findById(id);

    if (!credential) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.credentials
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return credential;
  }
}
