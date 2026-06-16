import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Section,
  CreateSectionDTO,
  UpdateSectionDTO
} from "../models/section.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = (60 * 60) * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `sections:${id}`,
  paginated: (page: number, limit: number) => `sections:page:${page}:limit:${limit}`,
  paginatedPattern: () => "sections:page:*",
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
  async create(dto: CreateSectionDTO): Promise<Section> {
    const result = await pool.query<Section>(
      `
      INSERT INTO teste.sections
        (employer_id, nome, descricao, status)
      VALUES ($1, $2, $3, COALESCE($4, 1))
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.employerId, dto.nome, dto.descricao ?? null, dto.status ?? null]
    );

    const row = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(row.id), row, CACHE_TTL),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return row;
  }

  async findById(id: string): Promise<Section | null> {
    const key = cacheKeys.byId(id);

    const cached = await cache.get<Section>(key);
    if (cached) {
      console.log("Cache HIT sections:", id);
      return cached;
    }

    const result = await pool.query<Section>(
      `SELECT ${SELECT_COLUMNS} FROM teste.sections WHERE id = $1`,
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
  ): Promise<PaginatedResult<Section>> {
    const cacheKey = cacheKeys.paginated(page, limit);

    const cached = await cache.get<PaginatedResult<Section>>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const offset = (page - 1) * limit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query<Section>(
        `
        SELECT ${SELECT_COLUMNS}
        FROM teste.sections
        ORDER BY data_criacao DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) as total FROM teste.sections`
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Section> = {
      data: rowsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
      [id, dto.employerId ?? null, dto.nome ?? null, dto.descricao ?? null, dto.status ?? null]
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

  async delete(id: string): Promise<Section | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    await pool.query(`DELETE FROM teste.sections WHERE id = $1`, [id]);

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return existing;
  }
}
