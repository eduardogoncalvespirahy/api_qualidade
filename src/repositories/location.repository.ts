import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Location,
  CreateLocationDTO,
  UpdateLocationDTO,
} from "../models/location.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `locations:${id}`,

  all: () => "locations:all",

  paginated: (page: number, limit: number) =>
    `locations:page:${page}:limit:${limit}`,

  listPattern: () => "locations:*",
};

const SELECT_COLUMNS = `
  id,
  employer_id as "employerId",
  nome,
  descricao,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class LocationRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateLocationDTO): Promise<Location> {
    const result = await pool.query<Location>(
      `
      INSERT INTO ${SCHEMA_UNICO}.locations
      (
        employer_id,
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
      [dto.employerId, dto.nome, dto.descricao ?? null, dto.status ?? null],
    );

    const location = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(location.id), location, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return location;
  }

  async findById(id: string): Promise<Location | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<Location>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<Location>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_UNICO}.locations
      WHERE id = $1
      `,
      [id],
    );

    const location = result.rows[0];

    if (!location) {
      return null;
    }

    await cache.set(cacheKey, location, CACHE_TTL);

    return location;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Location>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<Location>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_UNICO}.locations
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
      pool.query<Location>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_UNICO}.locations
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Location> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async update(id: string, dto: UpdateLocationDTO): Promise<Location | null> {
    const result = await pool.query<Location>(
      `
      UPDATE ${SCHEMA_UNICO}.locations
      SET
        employer_id = COALESCE($2, employer_id),
        nome = COALESCE($3, nome),
        descricao = COALESCE($4, descricao),
        status = COALESCE($5, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        id,
        dto.employerId ?? null,
        dto.nome ?? null,
        dto.descricao ?? null,
        dto.status ?? null,
      ],
    );

    const location = result.rows[0];

    if (!location) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), location, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return location;
  }

  async delete(id: string): Promise<Location | null> {
    const location = await this.findById(id);

    if (!location) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_UNICO}.locations
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return location;
  }
}
