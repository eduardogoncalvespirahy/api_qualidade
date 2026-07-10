import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  File,
  CreateFileDTO,
  UpdateFileDTO,
} from "../models/file.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

// cache de 24 horas igual os outros
const CACHE_TTL = 60 * 60 * 24;

const cacheKeys = {
  byId: (id: string) => `files:${id}`,
  all: () => "files:all",
  paginated: (page: number, limit: number) => `files:page:${page}:limit:${limit}`,
  listPattern: () => "files:*",
};

// colunas que vou selecionar, mapeando snake_case do banco pro camelCase do modelo
const SELECT_COLUMNS = `
  id,
  nome,
  nome_original as "nomeOriginal",
  extensao,
  mime_type as "mimeType",
  tamanho,
  conteudo,
  hash_sha256 as "hash",
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class FileRepository {
  // limpa o cache de listagem toda vez que altero algo
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateFileDTO): Promise<File> {
    const result = await pool.query<File>(
      `
      INSERT INTO ${SCHEMA_UNICO}.files
      (
        nome,
        nome_original,
        extensao,
        mime_type,
        tamanho,
        conteudo,
        hash_sha256,
        status,
        data_criacao
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 1), CURRENT_TIMESTAMP)
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        dto.nome,
        dto.nomeOriginal ?? null,
        dto.extensao ?? null,
        dto.mimeType ?? null,
        dto.tamanho ?? null,
        dto.conteudo ?? null,
        dto.hash ?? null,
        dto.status ?? null,
      ],
    );

    const file = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(file.id), file, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return file;
  }

  async findById(id: string): Promise<File | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<File>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<File>(
      `SELECT ${SELECT_COLUMNS} FROM ${SCHEMA_UNICO}.files WHERE id = $1`,
      [id],
    );

    const file = result.rows[0];
    if (!file) return null;

    await cache.set(cacheKey, file, CACHE_TTL);
    return file;
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResult<File>> {
    const isPaginated = page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<File>>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_UNICO}.files
      ORDER BY data_criacao DESC
    `;

    const params: unknown[] = [];

    if (isPaginated) {
      query += ` LIMIT $1 OFFSET $2`;
      params.push(limit, (page - 1) * limit);
    }

    const [rowsResult, countResult] = await Promise.all([
      pool.query<File>(query, params),
      pool.query<{ total: string }>(`SELECT COUNT(*) AS total FROM ${SCHEMA_UNICO}.files`),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<File> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);
    return response;
  }

  async update(id: string, dto: UpdateFileDTO): Promise<File | null> {
    const result = await pool.query<File>(
      `
      UPDATE ${SCHEMA_UNICO}.files
      SET
        nome          = COALESCE($2, nome),
        nome_original = COALESCE($3, nome_original),
        extensao      = COALESCE($4, extensao),
        mime_type     = COALESCE($5, mime_type),
        tamanho       = COALESCE($6, tamanho),
        conteudo      = COALESCE($7, conteudo),
        hash_sha256   = COALESCE($8, hash_sha256),
        status        = COALESCE($9, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        id,
        dto.nome ?? null,
        dto.nomeOriginal ?? null,
        dto.extensao ?? null,
        dto.mimeType ?? null,
        dto.tamanho ?? null,
        dto.conteudo ?? null,
        dto.hash ?? null,
        dto.status ?? null,
      ],
    );

    const file = result.rows[0];
    if (!file) return null;

    await Promise.all([
      cache.set(cacheKeys.byId(id), file, CACHE_TTL),
      this.invalidateListCache(),
    ]);

    return file;
  }

  async delete(id: string): Promise<File | null> {
    const file = await this.findById(id);
    if (!file) return null;

    await pool.query(`DELETE FROM ${SCHEMA_UNICO}.files WHERE id = $1`, [id]);

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return file;
  }
}
