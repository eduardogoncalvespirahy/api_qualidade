import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Machine,
  CreateMachineDTO,
  UpdateMachineDTO,
} from "../models/machine.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `machines:${id}`,

  all: () => "machines:all",

  paginated: (page: number, limit: number) =>
    `machines:page:${page}:limit:${limit}`,

  listPattern: () => "machines:*",
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
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateMachineDTO): Promise<Machine> {
    const result = await pool.query<Machine>(
      `
      INSERT INTO teste.machines
      (
        form_id,
        nome,
        descricao,
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
      [
        dto.formId,
        dto.nome,
        dto.descricao ?? null,
        dto.status ?? null,
      ]
    );

    const machine = result.rows[0];

    await Promise.all([
      cache.set(
        cacheKeys.byId(machine.id),
        machine,
        CACHE_TTL
      ),
      this.invalidateListCache(),
    ]);

    return machine;
  }

  async findById(id: string): Promise<Machine | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<Machine>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<Machine>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.machines
      WHERE id = $1
      `,
      [id]
    );

    const machine = result.rows[0];

    if (!machine) {
      return null;
    }

    await cache.set(
      cacheKey,
      machine,
      CACHE_TTL
    );

    return machine;
  }

  async findAll(
    page?: number,
    limit?: number
  ): Promise<PaginatedResult<Machine>> {
    const isPaginated =
      page !== undefined &&
      limit !== undefined &&
      page > 0 &&
      limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached =
      await cache.get<PaginatedResult<Machine>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.machines
      ORDER BY data_criacao DESC
    `;

    const params: unknown[] = [];

    if (isPaginated) {
      query += `
        LIMIT $1
        OFFSET $2
      `;

      params.push(
        limit,
        (page - 1) * limit
      );
    }

    const [rowsResult, countResult] = await Promise.all([
      pool.query<Machine>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.machines
        `
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Machine> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated
        ? Math.ceil(total / limit)
        : null,
    };

    await cache.set(
      cacheKey,
      response,
      CACHE_TTL
    );

    return response;
  }

  async update(
    id: string,
    dto: UpdateMachineDTO
  ): Promise<Machine | null> {
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
      [
        id,
        dto.formId ?? null,
        dto.nome ?? null,
        dto.descricao ?? null,
        dto.status ?? null,
      ]
    );

    const machine = result.rows[0];

    if (!machine) {
      return null;
    }

    await Promise.all([
      cache.set(
        cacheKeys.byId(id),
        machine,
        CACHE_TTL
      ),
      this.invalidateListCache(),
    ]);

    return machine;
  }

  async delete(id: string): Promise<Machine | null> {
    const machine = await this.findById(id);

    if (!machine) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.machines
      WHERE id = $1
      `,
      [id]
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return machine;
  }
}