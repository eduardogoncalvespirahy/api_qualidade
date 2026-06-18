import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Section,
  CreateSectionDTO,
  UpdateSectionDTO,
} from "../models/section.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `sections:${id}`,

  all: () => "sections:all",

  paginated: (page: number, limit: number) =>
    `sections:page:${page}:limit:${limit}`,

  listPattern: () => "sections:*",
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

export class SectionRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateSectionDTO): Promise<Section> {
    const result = await pool.query<Section>(
      `
      INSERT INTO teste.sections
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

    const section = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(section.id), section, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return section;
  }

  async findById(id: string): Promise<Section | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<Section>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<Section>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.sections
      WHERE id = $1
      `,
      [id],
    );

    const section = result.rows[0];

    if (!section) {
      return null;
    }

    await cache.set(cacheKey, section, CACHE_TTL);

    return section;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Section>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<Section>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.sections
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
      pool.query<Section>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.sections
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Section> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async update(id: string, dto: UpdateSectionDTO): Promise<Section | null> {
    const result = await pool.query<Section>(
      `
      UPDATE teste.sections
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

    const section = result.rows[0];

    if (!section) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), section, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return section;
  }

  async delete(id: string): Promise<Section | null> {
    const section = await this.findById(id);

    if (!section) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.sections
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return section;
  }
}
