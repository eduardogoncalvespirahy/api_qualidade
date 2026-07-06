import { pool } from "../config/database";
import { ControlStatus } from "../models/controlStatus.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byControl: (controlId: string) => `control_status:control:${controlId}`,

  statusNames: (controlId: string) => `control_status:status:${controlId}`,
};

export class ControlStatusRepository {
  private async invalidateControlCache(controlId: string): Promise<void> {
    await Promise.all([
      cache.delete(cacheKeys.byControl(controlId)),
      cache.delete(cacheKeys.statusNames(controlId)),
    ]);
  }

  async create(controlId: string, statusId: string): Promise<ControlStatus> {
    const result = await pool.query<ControlStatus>(
      `
      INSERT INTO teste.control_status
      (
        control_id,
        status_id
      )
      VALUES
      (
        $1,
        $2
      )
      ON CONFLICT
      (
        control_id,
        status_id
      )
      DO NOTHING
      RETURNING
        control_id as "controlId",
        status_id as "statusId"
      `,
      [controlId, statusId],
    );

    await this.invalidateControlCache(controlId);

    return (
      result.rows[0] ?? {
        controlId,
        statusId,
      }
    );
  }

  async findByControl(controlId: string): Promise<ControlStatus[]> {
    const cacheKey = cacheKeys.byControl(controlId);

    const cached = await cache.get<ControlStatus[]>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<ControlStatus>(
      `
      SELECT
        control_id as "controlId",
        status_id as "statusId"
      FROM teste.control_status
      WHERE control_id = $1
      `,
      [controlId],
    );

    await cache.set(cacheKey, result.rows, CACHE_TTL);

    return result.rows;
  }

  async findstatusNamesByControl(controlId: string): Promise<string[]> {
    const cacheKey = cacheKeys.statusNames(controlId);

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
      FROM teste.control_status cr
      INNER JOIN teste.status r
        ON r.id = cr.status_id
      WHERE cr.control_id = $1
      `,
      [controlId],
    );

    const status = result.rows.map((r) => r.nome);

    await cache.set(cacheKey, status, CACHE_TTL);

    return status;
  }

  async update(
    controlId: string,
    statusId: string,
  ): Promise<ControlStatus | null> {
    const result = await pool.query<ControlStatus>(
      `
      UPDATE teste.control_status
      SET
        status_id = $2
      WHERE control_id = $1
      RETURNING
        control_id as "controlId",
        status_id as "statusId"
      `,
      [controlId, statusId],
    );

    const form = result.rows[0];

    if (form) {
      await this.invalidateControlCache(controlId);
    }

    return form ?? null;
  }

  async delete(controlId: string, statusId: string): Promise<boolean> {
    const result = await pool.query(
      `
      DELETE FROM teste.control_status
      WHERE control_id = $1
      AND status_id = $2
      `,
      [controlId, statusId],
    );

    if ((result.rowCount ?? 0) > 0) {
      await this.invalidateControlCache(controlId);
    }

    return (result.rowCount ?? 0) > 0;
  }
}
