import { pool } from "../config/database";
import { CredentialLocation } from "../models/credentialLocation.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byCredential: (credentialId: string) =>
    `credentials_locations:credential:${credentialId}`,

  locationNames: (credentialId: string) =>
    `credentials_locations:locations:${credentialId}`,
};

export class CredentialLocationRepository {
  private async invalidateCredentialCache(credentialId: string): Promise<void> {
    await Promise.all([
      cache.delete(cacheKeys.byCredential(credentialId)),
      cache.delete(cacheKeys.locationNames(credentialId)),
    ]);
  }

  async create(
    credentialId: string,
    locationId: string,
  ): Promise<CredentialLocation> {
    const result = await pool.query<CredentialLocation>(
      `
      INSERT INTO ${SCHEMA_UNICO}.credentials_locations
      (
        credential_id,
        location_id
      )
      VALUES
      (
        $1,
        $2
      )
      ON CONFLICT
      (
        credential_id,
        location_id
      )
      DO NOTHING
      RETURNING
        credential_id as "credentialId",
        location_id as "locationId"
      `,
      [credentialId, locationId],
    );

    await this.invalidateCredentialCache(credentialId);

    return (
      result.rows[0] ?? {
        credentialId,
        locationId,
      }
    );
  }

  async findByCredential(credentialId: string): Promise<CredentialLocation[]> {
    const cacheKey = cacheKeys.byCredential(credentialId);

    const cached = await cache.get<CredentialLocation[]>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<CredentialLocation>(
      `
      SELECT
        credential_id as "credentialId",
        location_id as "locationId"
      FROM ${SCHEMA_UNICO}.credentials_locations
      WHERE credential_id = $1
      `,
      [credentialId],
    );

    await cache.set(cacheKey, result.rows, CACHE_TTL);

    return result.rows;
  }

  async findLocationNamesByCredential(credentialId: string): Promise<string[]> {
    const cacheKey = cacheKeys.locationNames(credentialId);

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
      FROM ${SCHEMA_UNICO}.credentials_locations cr
      INNER JOIN ${SCHEMA_UNICO}.locations r
        ON r.id = cr.location_id
      WHERE cr.credential_id = $1
      `,
      [credentialId],
    );

    const locations = result.rows.map((r) => r.nome);

    await cache.set(cacheKey, locations, CACHE_TTL);

    return locations;
  }

  async delete(credentialId: string, locationId: string): Promise<boolean> {
    const result = await pool.query(
      `
      DELETE FROM ${SCHEMA_UNICO}.credentials_locations
      WHERE credential_id = $1
      AND location_id = $2
      `,
      [credentialId, locationId],
    );

    if ((result.rowCount ?? 0) > 0) {
      await this.invalidateCredentialCache(credentialId);
    }

    return (result.rowCount ?? 0) > 0;
  }
}
