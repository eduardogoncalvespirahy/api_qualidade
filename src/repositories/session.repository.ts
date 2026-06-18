import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import { Session, CreateSessionDTO } from "../models/session.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `sessions:${id}`,

  byRefreshToken: (refreshToken: string) => `sessions:refresh:${refreshToken}`,

  all: () => "sessions:all",

  paginated: (page: number, limit: number) =>
    `sessions:page:${page}:limit:${limit}`,

  listPattern: () => "sessions:*",
};

const SELECT_COLUMNS = `
  id,
  credential_id  as "credentialId",
  refreshtoken,
  expira,
  revogado,
  data_criacao   as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class SessionRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateSessionDTO): Promise<Session> {
    const result = await pool.query<Session>(
      `
      INSERT INTO teste.sessions
      (
        credential_id,
        refreshtoken,
        expira
      )
      VALUES
      (
        $1,
        $2,
        $3
      )
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.credentialId, dto.refreshtoken, dto.expira],
    );

    const session = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(session.id), session, CACHE_TTL),
      cache.set(
        cacheKeys.byRefreshToken(session.refreshtoken),
        session,
        CACHE_TTL,
      ),
      this.invalidateListCache(),
    ]);

    return session;
  }

  async findById(id: string): Promise<Session | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<Session>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<Session>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.sessions
      WHERE id = $1
      `,
      [id],
    );

    const session = result.rows[0];

    if (!session) {
      return null;
    }

    await cache.set(cacheKey, session, CACHE_TTL);

    return session;
  }

  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    const cacheKey = cacheKeys.byRefreshToken(refreshToken);

    const cached = await cache.get<Session>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<Session>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.sessions
      WHERE refreshtoken = $1
      `,
      [refreshToken],
    );

    const session = result.rows[0];

    if (!session) {
      return null;
    }

    await cache.set(cacheKey, session, CACHE_TTL);

    return session;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Session>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<Session>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.sessions
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
      pool.query<Session>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.sessions
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Session> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async revoke(id: string): Promise<Session | null> {
    const current = await this.findById(id);

    const result = await pool.query<Session>(
      `
      UPDATE teste.sessions
      SET
        revogado = true,
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id],
    );

    const session = result.rows[0];

    if (!session) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), session, CACHE_TTL),
      current
        ? cache.set(
            cacheKeys.byRefreshToken(current.refreshtoken),
            session,
            CACHE_TTL,
          )
        : Promise.resolve(),
      this.invalidateListCache(),
    ]);

    return session;
  }

  async delete(id: string): Promise<Session | null> {
    const session = await this.findById(id);

    if (!session) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.sessions
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      cache.delete(cacheKeys.byRefreshToken(session.refreshtoken)),
      this.invalidateListCache(),
    ]);

    return session;
  }
}
