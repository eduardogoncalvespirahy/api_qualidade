import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Answer,
  CreateAnswerDTO,
  UpdateAnswerDTO,
} from "../models/answer.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `answers:${id}`,

  all: () => "answers:all",

  paginated: (page: number, limit: number) =>
    `answers:page:${page}:limit:${limit}`,

  listPattern: () => "answers:*",
};

const SELECT_COLUMNS = `
  id,
  form_id as "formId",
  nome,
  descricao,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao",
  categorie_id as "categoryId"
`;

export class AnswerRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateAnswerDTO): Promise<Answer> {
    const result = await pool.query<Answer>(
      `
      INSERT INTO ${SCHEMA_QUALIDADE}.answers
      (
        form_id,
        nome,
        descricao,
        status,
        categorie_id
      )
      VALUES
      (
        $1,
        $2,
        $3,
        COALESCE($4, 1),
        $5
      )
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.formId, dto.nome, dto.descricao ?? null, dto.status ?? null, dto.categoryId ?? null],
    );
    
    const answer = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(answer.id), answer, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return answer;
  }

  async findById(id: string): Promise<Answer | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<Answer>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<Answer>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.answers
      WHERE id = $1
      `,
      [id],
    );

    const answer = result.rows[0];

    if (!answer) {
      return null;
    }

    await cache.set(cacheKey, answer, CACHE_TTL);

    return answer;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Answer>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<Answer>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_QUALIDADE}.answers
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
      pool.query<Answer>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_QUALIDADE}.answers
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Answer> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async update(id: string, dto: UpdateAnswerDTO): Promise<Answer | null> {
    const result = await pool.query<Answer>(
      `
      UPDATE ${SCHEMA_QUALIDADE}.answers
      SET
        form_id = COALESCE($2, form_id),
        nome = COALESCE($3, nome),
        descricao = COALESCE($4, descricao),
        status = COALESCE($5, status),
        categorie_id =  COALESCE($6, categorie_id),
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
        dto.categoryId ?? null
      ],
    );

    const answer = result.rows[0];

    if (!answer) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), answer, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return answer;
  }

  async delete(id: string): Promise<Answer | null> {
    const answer = await this.findById(id);

    if (!answer) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_QUALIDADE}.answers
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return answer;
  }
}
