import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Session,
  CreateSessionDTO
} from "../models/session.model";

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
  async create(dto: CreateSessionDTO): Promise<Session> {
    const result = await pool.query<Session>(
      `
      INSERT INTO teste.sessions
        (credential_id, refreshtoken, expira)
      VALUES ($1, $2, $3)
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.credentialId, dto.refreshtoken, dto.expira]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<Session | null> {
    const result = await pool.query<Session>(
      `SELECT ${SELECT_COLUMNS} FROM teste.sessions WHERE id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findByRefreshToken(refreshtoken: string): Promise<Session | null> {
    const result = await pool.query<Session>(
      `SELECT ${SELECT_COLUMNS} FROM teste.sessions WHERE refreshtoken = $1`,
      [refreshtoken]
    );
    return result.rows[0] ?? null;
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Session>> {
    const offset = (page - 1) * limit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query<Session>(
        `
        SELECT ${SELECT_COLUMNS}
        FROM teste.sessions
        ORDER BY data_criacao DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) as total FROM teste.sessions`
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

  async revoke(id: string): Promise<Session | null> {
    const result = await pool.query<Session>(
      `
      UPDATE teste.sessions
      SET revogado = true, data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async delete(id: string): Promise<Session | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }
    await pool.query(`DELETE FROM teste.sessions WHERE id = $1`, [id]);
    return existing;
  }
}
