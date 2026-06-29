import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import { AnswerGroups, CreateAnswerGroupsDTO, UpdateAnswerGroupsDTO } from "../models/answerGroups.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `answerGroups:${id}`,

  all: () => "answerGroups:all",

  paginated: (page: number, limit: number) =>
    `answerGroups:page:${page}:limit:${limit}`,

  listPattern: () => "answerGroups:*",
};

const SELECT_COLUMNS = `
  id,
  form_id as "formId",
  nome,
  descricao,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class AnswerGroupsRepository {
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateAnswerGroupsDTO): Promise<AnswerGroups> {
    const result = await pool.query<AnswerGroups>(
      `
      INSERT INTO teste.answer_groups
      (
        form_id,
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
      [dto.formId, dto.nome, dto.descricao ?? null, dto.status ?? null],
    );

    const answerGroup = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(answerGroup.id), answerGroup, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return answerGroup;
  }

  async findById(id: string): Promise<AnswerGroups | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<AnswerGroups>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<AnswerGroups>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.answer_groups
      WHERE id = $1
      `,
      [id],
    );

    const answerGroup = result.rows[0];

    if (!answerGroup) {
      return null;
    }

    await cache.set(cacheKey, answerGroup, CACHE_TTL);

    return answerGroup;
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResult<AnswerGroups>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<AnswerGroups>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.answer_groups
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
      pool.query<AnswerGroups>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.answer_groups
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<AnswerGroups> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async update(id: string, dto: UpdateAnswerGroupsDTO): Promise<AnswerGroups | null> {
    const result = await pool.query<AnswerGroups>(
      `
      UPDATE teste.answer_groups
      SET
        form_id = COALESCE($2, form_id),
        nome = COALESCE($3, nome),
        descricao = COALESCE($4, descricao),
        status = COALESCE($5, status),
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
      ],
    );

    const answerGroup = result.rows[0];

    if (!answerGroup) {
      return null;
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), answerGroup, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return answerGroup;
  }

  async delete(id: string): Promise<AnswerGroups | null> {
    const answerGroup = await this.findById(id);

    if (!answerGroup) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.answer_groups
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return answerGroup;
  }
}
