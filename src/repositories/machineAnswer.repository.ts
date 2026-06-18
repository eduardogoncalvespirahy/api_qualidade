import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  MachineAnswer,
  CreateMachineAnswerDTO,
  UpdateMachineAnswerDTO,
} from "../models/machineAnswer.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `machine-answers:${id}`,

  all: () => "machine-answers:all",

  paginated: (page: number, limit: number) =>
    `machine-answers:page:${page}:limit:${limit}`,

  listPattern: () => "machine-answers:*",
};

const SELECT_COLUMNS = `
  id,
  machine_id as "machineId",
  nome,
  descricao,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class MachineAnswerRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateMachineAnswerDTO): Promise<MachineAnswer> {
    const result = await pool.query<MachineAnswer>(
      `
      INSERT INTO teste.machine_answers
      (
        machine_id,
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
      [dto.machineId, dto.nome, dto.descricao ?? null, dto.status ?? null],
    );

    const machineAnswer = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(machineAnswer.id), machineAnswer, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return machineAnswer;
  }

  async findById(id: string): Promise<MachineAnswer | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<MachineAnswer>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<MachineAnswer>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.machine_answers
      WHERE id = $1
      `,
      [id],
    );

    const machineAnswer = result.rows[0];

    if (!machineAnswer) {
      return null;
    }

    await cache.set(cacheKey, machineAnswer, CACHE_TTL);

    return machineAnswer;
  }

  async findByMachineId(machineId: string): Promise<MachineAnswer[]> {
    const result = await pool.query<MachineAnswer>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.machine_answers
      WHERE machine_id = $1
      ORDER BY nome ASC
      `,
      [machineId],
    );

    return result.rows;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<MachineAnswer>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<MachineAnswer>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.machine_answers
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
      pool.query<MachineAnswer>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.machine_answers
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<MachineAnswer> = {
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
    dto: UpdateMachineAnswerDTO,
  ): Promise<MachineAnswer | null> {
    const result = await pool.query<MachineAnswer>(
      `
      UPDATE teste.machine_answers
      SET
        machine_id = COALESCE($2, machine_id),
        nome = COALESCE($3, nome),
        descricao = COALESCE($4, descricao),
        status = COALESCE($5, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        id,
        dto.machineId ?? null,
        dto.nome ?? null,
        dto.descricao ?? null,
        dto.status ?? null,
      ],
    );

    const machineAnswer = result.rows[0];

    if (!machineAnswer) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), machineAnswer, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return machineAnswer;
  }

  async delete(id: string): Promise<MachineAnswer | null> {
    const machineAnswer = await this.findById(id);

    if (!machineAnswer) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.machine_answers
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return machineAnswer;
  }
}
