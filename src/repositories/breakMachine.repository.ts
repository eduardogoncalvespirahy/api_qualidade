import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  BreakMachine,
  CreateBreakMachineDTO,
  UpdateBreakMachineDTO,
} from "../models/breakMachine.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `breaks-machines:${id}`,

  all: () => "breaks-machines:all",

  paginated: (page: number, limit: number) =>
    `breaks-machines:page:${page}:limit:${limit}`,

  listPattern: () => "breaks-machines:*",
};

const SELECT_COLUMNS = `
  id,
  machine_id as "machineId",
  hora_inicio as "horaInicio",
  hora_fim as "horaFim",
  motivo,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class BreakMachineRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateBreakMachineDTO): Promise<BreakMachine> {
    const result = await pool.query<BreakMachine>(
      `
      INSERT INTO teste.breaks_machines
      (
        machine_id,
        hora_inicio,
        hora_fim,
        motivo,
        status
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        COALESCE($5, 1)
      )
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        dto.machineId,
        dto.horaInicio,
        dto.horaFim ?? null,
        dto.motivo,
        dto.status ?? null,
      ],
    );

    const breakMachine = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(breakMachine.id), breakMachine, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return breakMachine;
  }

  async findById(id: string): Promise<BreakMachine | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<BreakMachine>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<BreakMachine>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.breaks_machines
      WHERE id = $1
      `,
      [id],
    );

    const breakMachine = result.rows[0];

    if (!breakMachine) {
      return null;
    }

    await cache.set(cacheKey, breakMachine, CACHE_TTL);

    return breakMachine;
  }

  async findByMachineId(machineId: string): Promise<BreakMachine[]> {
    const result = await pool.query<BreakMachine>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.breaks_machines
      WHERE machine_id = $1
      ORDER BY hora_inicio ASC
      `,
      [machineId],
    );

    return result.rows;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<BreakMachine>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<BreakMachine>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.breaks_machines
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
      pool.query<BreakMachine>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.breaks_machines
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<BreakMachine> = {
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
    dto: UpdateBreakMachineDTO,
  ): Promise<BreakMachine | null> {
    const result = await pool.query<BreakMachine>(
      `
      UPDATE teste.breaks_machines
      SET
        machine_id = COALESCE($2, machine_id),
        hora_inicio = COALESCE($3, hora_inicio),
        hora_fim = COALESCE($4, hora_fim),
        motivo = COALESCE($5, motivo),
        status = COALESCE($6, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        id,
        dto.machineId ?? null,
        dto.horaInicio ?? null,
        dto.horaFim ?? null,
        dto.motivo ?? null,
        dto.status ?? null,
      ],
    );

    const breakMachine = result.rows[0];

    if (!breakMachine) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), breakMachine, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return breakMachine;
  }

  async delete(id: string): Promise<BreakMachine | null> {
    const breakMachine = await this.findById(id);

    if (!breakMachine) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.breaks_machines
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return breakMachine;
  }
}
