import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  FormGroups,
  CreateFormGroupsDTO,
  UpdateFormGroupsDTO,
} from "../models/formGroups.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `formGroups:${id}`,

  all: () => "formGroups:all",

  paginated: (page: number, limit: number) =>
    `formGroups:page:${page}:limit:${limit}`,

  listPattern: () => "formGroups:*",
};

const SELECT_COLUMNS = `
  id,
  section_id as "sectionId",
  nome,
  descricao,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class FormGroupsRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateFormGroupsDTO): Promise<FormGroups> {
    const result = await pool.query<FormGroups>(
      `
      INSERT INTO ${SCHEMA_QUALIDADE}.form_groups
      (
        section_id,
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
      [dto.sectionId, dto.nome, dto.descricao ?? null, dto.status ?? null],
    );

    const formGroup = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(formGroup.id), formGroup, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return formGroup;
  }

  async findById(id: string): Promise<FormGroups | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<FormGroups>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<FormGroups>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.form_groups
      WHERE id = $1
      `,
      [id],
    );

    const formGroup = result.rows[0];

    if (!formGroup) {
      return null;
    }

    await cache.set(cacheKey, formGroup, CACHE_TTL);

    return formGroup;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<FormGroups>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<FormGroups>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.form_groups
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
      pool.query<FormGroups>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_QUALIDADE}.form_groups
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<FormGroups> = {
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
    dto: UpdateFormGroupsDTO,
  ): Promise<FormGroups | null> {
    const result = await pool.query<FormGroups>(
      `
      UPDATE ${SCHEMA_QUALIDADE}.form_groups
      SET
        section_id = COALESCE($2, section_id),
        nome = COALESCE($3, nome),
        descricao = COALESCE($4, descricao),
        status = COALESCE($5, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        id,
        dto.sectionId ?? null,
        dto.nome ?? null,
        dto.descricao ?? null,
        dto.status ?? null,
      ],
    );

    const formGroup = result.rows[0];

    if (!formGroup) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), formGroup, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return formGroup;
  }

  async delete(id: string): Promise<FormGroups | null> {
    const formGroup = await this.findById(id);

    if (!formGroup) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_QUALIDADE}.form_groups
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return formGroup;
  }
}
