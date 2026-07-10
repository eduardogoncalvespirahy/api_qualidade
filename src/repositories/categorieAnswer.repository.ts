import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  CategorieAnswer,
  CreateCategorieAnswerDTO,
  UpdateCategorieAnswerDTO,
} from "../models/categorieAnswer.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `categories-answers:${id}`,

  all: () => "categories-answers:all",

  paginated: (page: number, limit: number) =>
    `categories-answers:page:${page}:limit:${limit}`,

  listPattern: () => "categories-answers:*",
};

const SELECT_COLUMNS = `
  id,
  nome,
  descricao,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class CategorieAnswerRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateCategorieAnswerDTO): Promise<CategorieAnswer> {
    const result = await pool.query<CategorieAnswer>(
      `
      INSERT INTO ${SCHEMA_QUALIDADE}.categories_answers
      (
        nome,
        descricao,
        status
      )
      VALUES
      (
        $1,
        $2,
        COALESCE($3, 1)
      )
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.nome ?? null, dto.descricao ?? null, dto.status ?? null],
    );

    const categorieAnswer = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(categorieAnswer.id), categorieAnswer, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return categorieAnswer;
  }

  async findById(id: string): Promise<CategorieAnswer | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<CategorieAnswer>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<CategorieAnswer>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.categories_answers
      WHERE id = $1
      `,
      [id],
    );

    const categorieAnswer = result.rows[0];

    if (!categorieAnswer) {
      return null;
    }

    await cache.set(cacheKey, categorieAnswer, CACHE_TTL);

    return categorieAnswer;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<CategorieAnswer>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<CategorieAnswer>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.categories_answers
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
      pool.query<CategorieAnswer>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_QUALIDADE}.categories_answers
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<CategorieAnswer> = {
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
    dto: UpdateCategorieAnswerDTO,
  ): Promise<CategorieAnswer | null> {
    const result = await pool.query<CategorieAnswer>(
      `
      UPDATE ${SCHEMA_QUALIDADE}.categories_answers
      SET
        nome = COALESCE($2, nome),
        descricao = COALESCE($3, descricao),
        status = COALESCE($4, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, dto.nome ?? null, dto.descricao ?? null, dto.status ?? null],
    );

    const categorieAnswer = result.rows[0];

    if (!categorieAnswer) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), categorieAnswer, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return categorieAnswer;
  }

  async delete(id: string): Promise<CategorieAnswer | null> {
    const categorieAnswer = await this.findById(id);

    if (!categorieAnswer) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_QUALIDADE}.categories_answers
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return categorieAnswer;
  }
}
