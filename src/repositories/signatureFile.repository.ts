import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  SignatureFile,
  CreateSignatureFileDTO,
  UpdateSignatureFileDTO,
} from "../models/signatureFile.model";
import { RedisRepository } from "./redis.repository";

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
  hash,
  status,
  data_criacao as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class SignatureFileRepository {
  // limpa o cache de listagem toda vez que altero algo
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  async create(dto: CreateSignatureFileDTO): Promise<SignatureFile> {
    const result = await pool.query<SignatureFile>(
      `
      INSERT INTO teste.files
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

  async findById(id: string): Promise<SignatureFile | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<SignatureFile>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<SignatureFile>(
      `SELECT ${SELECT_COLUMNS} FROM teste.files WHERE id = $1`,
      [id],
    );

    const file = result.rows[0];
    if (!file) return null;

    await cache.set(cacheKey, file, CACHE_TTL);
    return file;
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResult<SignatureFile>> {
    const isPaginated = page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<SignatureFile>>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.files
      ORDER BY data_criacao DESC
    `;

    const params: unknown[] = [];

    if (isPaginated) {
      query += ` LIMIT $1 OFFSET $2`;
      params.push(limit, (page - 1) * limit);
    }

    const [rowsResult, countResult] = await Promise.all([
      pool.query<SignatureFile>(query, params),
      pool.query<{ total: string }>(`SELECT COUNT(*) AS total FROM teste.files`),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<SignatureFile> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);
    return response;
  }

  async update(id: string, dto: UpdateSignatureFileDTO): Promise<SignatureFile | null> {
    const result = await pool.query<SignatureFile>(
      `
      UPDATE teste.files
      SET
        nome          = COALESCE($2, nome),
        nome_original = COALESCE($3, nome_original),
        extensao      = COALESCE($4, extensao),
        mime_type     = COALESCE($5, mime_type),
        tamanho       = COALESCE($6, tamanho),
        conteudo      = COALESCE($7, conteudo),
        hash_sha256   = COALESCE($8, hash),
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

  async delete(id: string): Promise<SignatureFile | null> {
    const file = await this.findById(id);
    if (!file) return null;

    await pool.query(`DELETE FROM teste.files WHERE id = $1`, [id]);

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      this.invalidateListCache(),
    ]);

    return file;
  }
}
