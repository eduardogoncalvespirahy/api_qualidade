import { pool } from "../config/database";
import { CredentialRole } from "../models/credentialRole.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byCredential: (credentialId: string) =>
    `credentials_roles:credential:${credentialId}`,

  roleNames: (credentialId: string) =>
    `credentials_roles:roles:${credentialId}`,
};

export class CredentialRoleRepository {
  private async invalidateCredentialCache(credentialId: string): Promise<void> {
    await Promise.all([
      cache.delete(cacheKeys.byCredential(credentialId)),
      cache.delete(cacheKeys.roleNames(credentialId)),
    ]);
  }

  async create(credentialId: string, roleId: string): Promise<CredentialRole> {
    const result = await pool.query<CredentialRole>(
      `
      INSERT INTO ${SCHEMA_UNICO}.credentials_roles
      (
        credential_id,
        role_id
      )
      VALUES
      (
        $1,
        $2
      )
      ON CONFLICT
      (
        credential_id,
        role_id
      )
      DO NOTHING
      RETURNING
        credential_id as "credentialId",
        role_id as "roleId"
      `,
      [credentialId, roleId],
    );

    await this.invalidateCredentialCache(credentialId);

    return (
      result.rows[0] ?? {
        credentialId,
        roleId,
      }
    );
  }

  async findByCredential(credentialId: string): Promise<CredentialRole[]> {
    const cacheKey = cacheKeys.byCredential(credentialId);

    const cached = await cache.get<CredentialRole[]>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<CredentialRole>(
      `
      SELECT
        credential_id as "credentialId",
        role_id as "roleId"
      FROM ${SCHEMA_UNICO}.credentials_roles
      WHERE credential_id = $1
      `,
      [credentialId],
    );

    await cache.set(cacheKey, result.rows, CACHE_TTL);

    return result.rows;
  }

  async findRoleNamesByCredential(credentialId: string): Promise<string[]> {
    const cacheKey = cacheKeys.roleNames(credentialId);

    const cached = await cache.get<string[]>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<{
      nome: string;
    }>(
      `
      SELECT r.nome
      FROM ${SCHEMA_UNICO}.credentials_roles cr
      INNER JOIN ${SCHEMA_UNICO}.roles r
        ON r.id = cr.role_id
      WHERE cr.credential_id = $1
      `,
      [credentialId],
    );

    const roles = result.rows.map((r) => r.nome);

    await cache.set(cacheKey, roles, CACHE_TTL);

    return roles;
  }

  async delete(credentialId: string, roleId: string): Promise<boolean> {
    const result = await pool.query(
      `
      DELETE FROM ${SCHEMA_UNICO}.credentials_roles
      WHERE credential_id = $1
      AND role_id = $2
      `,
      [credentialId, roleId],
    );

    if ((result.rowCount ?? 0) > 0) {
      await this.invalidateCredentialCache(credentialId);
    }

    return (result.rowCount ?? 0) > 0;
  }
}
