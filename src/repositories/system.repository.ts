import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  System,
  CreateSystemDTO,
  UpdateSystemDTO,
} from "../models/system.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `systems:${id}`,

  all: () => "systems:all",

  paginated: (page: number, limit: number) =>
    `systems:page:${page}:limit:${limit}`,

  listPattern: () => "systems:*",
};

const SELECT_COLUMNS = `
  id,
  nome,
  descricao,
  url,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class SystemRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateSystemDTO): Promise<System> {
    const result = await pool.query<System>(
      `
      INSERT INTO ${SCHEMA_UNICO}.systems
      (
        nome,
        descricao,
        url,
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
      [dto.nome, dto.descricao ?? null, dto.url ?? null, dto.status ?? null],
    );

    const system = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(system.id), system, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return system;
  }

  async findById(id: string): Promise<System | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<System>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<System>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_UNICO}.systems
      WHERE id = $1
      `,
      [id],
    );

    const system = result.rows[0];

    if (!system) {
      return null;
    }

    await cache.set(cacheKey, system, CACHE_TTL);

    return system;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<System>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<System>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_UNICO}.systems
      ORDER BY data_criacao DESC
    `;

    const params: any[] = [];

    if (isPaginated) {
      query += `
        LIMIT $1
        OFFSET $2
      `;

      params.push(limit, (page - 1) * limit);
    }

    const [rowsResult, countResult] = await Promise.all([
      pool.query<System>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_UNICO}.systems
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<System> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async update(id: string, dto: UpdateSystemDTO): Promise<System | null> {
    const result = await pool.query<System>(
      `
      UPDATE ${SCHEMA_UNICO}.systems
      SET
        nome = COALESCE($2, nome),
        descricao = COALESCE($3, descricao),
        url = COALESCE($4, url),
        status = COALESCE($5, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        id,
        dto.nome ?? null,
        dto.descricao ?? null,
        dto.url ?? null,
        dto.status ?? null,
      ],
    );

    const system = result.rows[0];

    if (!system) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), system, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return system;
  }

  async delete(id: string): Promise<System | null> {
    const system = await this.findById(id);

    if (!system) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_UNICO}.systems
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return system;
  }
}
