import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Machine,
  CreateMachineDTO,
  UpdateMachineDTO
} from "../models/machine.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = (60 * 60) * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `machines:${id}`,
  paginated: (page: number, limit: number) => `machines:page:${page}:limit:${limit}`,
  paginatedPattern: () => "machines:page:*",
};

const SELECT_COLUMNS = `
  id,
  form_id as "formId",
  nome,
  descricao,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class MachineRepository {
  async create(dto: CreateMachineDTO): Promise<Machine> {
    const result = await pool.query<Machine>(
      `
      INSERT INTO teste.machines
        (form_id, nome, descricao, status)
      VALUES ($1, $2, $3, COALESCE($4, 1))
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.formId, dto.nome, dto.descricao ?? null, dto.status ?? null]
    );

    const row = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(row.id), row, CACHE_TTL),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return row;
  }

  async findById(id: string): Promise<Machine | null> {
    const key = cacheKeys.byId(id);

    const cached = await cache.get<Machine>(key);
    if (cached) {
      console.log("Cache HIT machines:", id);
      return cached;
    }

    const result = await pool.query<Machine>(
      `SELECT ${SELECT_COLUMNS} FROM teste.machines WHERE id = $1`,
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
  ): Promise<PaginatedResult<Machine>> {
    const cacheKey = cacheKeys.paginated(page, limit);

    const cached = await cache.get<PaginatedResult<Machine>>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const offset = (page - 1) * limit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query<Machine>(
        `
        SELECT ${SELECT_COLUMNS}
        FROM teste.machines
        ORDER BY data_criacao DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) as total FROM teste.machines`
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Machine> = {
      data: rowsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cache.set(cacheKey, response, CACHE_TTL);
    return response;
  }

  async update(id: string, dto: UpdateMachineDTO): Promise<Machine | null> {
    const result = await pool.query<Machine>(
      `
      UPDATE teste.machines
      SET
        form_id = COALESCE($2, form_id),
        nome = COALESCE($3, nome),
        descricao = COALESCE($4, descricao),
        status = COALESCE($5, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, dto.formId ?? null, dto.nome ?? null, dto.descricao ?? null, dto.status ?? null]
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

  async delete(id: string): Promise<Machine | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    await pool.query(`DELETE FROM teste.machines WHERE id = $1`, [id]);

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return existing;
  }
}
