import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import { Role, CreateRoleDTO, UpdateRoleDTO } from "../models/role.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `roles:${id}`,

  all: () => "roles:all",

  paginated: (page: number, limit: number) =>
    `roles:page:${page}:limit:${limit}`,

  listPattern: () => "roles:*",
};

const SELECT_COLUMNS = `
  id,
  system_id as "systemId",
  nome,
  descricao,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class RoleRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateRoleDTO): Promise<Role> {
    const result = await pool.query<Role>(
      `
      INSERT INTO ${SCHEMA_UNICO}.roles
      (
        system_id,
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
      [dto.systemId, dto.nome, dto.descricao ?? null, dto.status ?? null],
    );

    const role = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(role.id), role, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return role;
  }

  async findById(id: string): Promise<Role | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<Role>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<Role>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_UNICO}.roles
      WHERE id = $1
      `,
      [id],
    );

    const role = result.rows[0];

    if (!role) {
      return null;
    }

    await cache.set(cacheKey, role, CACHE_TTL);

    return role;
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResult<Role>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<Role>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_UNICO}.roles
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
      pool.query<Role>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_UNICO}.roles
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Role> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async update(id: string, dto: UpdateRoleDTO): Promise<Role | null> {
    const result = await pool.query<Role>(
      `
      UPDATE ${SCHEMA_UNICO}.roles
      SET
        system_id = COALESCE($2, system_id),
        nome = COALESCE($3, nome),
        descricao = COALESCE($4, descricao),
        status = COALESCE($5, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        id,
        dto.systemId ?? null,
        dto.nome ?? null,
        dto.descricao ?? null,
        dto.status ?? null,
      ],
    );

    const role = result.rows[0];

    if (!role) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), role, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return role;
  }

  async delete(id: string): Promise<Role | null> {
    const role = await this.findById(id);

    if (!role) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_UNICO}.roles
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return role;
  }
}
