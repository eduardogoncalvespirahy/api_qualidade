import { PoolClient, QueryResult, QueryResultRow } from "pg";
import { pool } from "../config/database";

export class PostgresRepository {
  async query<T extends QueryResultRow = any>(
    sql: string,
    params: any[] = [],
  ): Promise<QueryResult<T>> {
    return pool.query<T>(sql, params);
  }

  async getClient(): Promise<PoolClient> {
    return pool.connect();
  }

  async findEmployeeHashes() {
    const result =
      await pool.query(
        `
        SELECT
          id,
          hash
        FROM teste.employees
        `
      );

      return result.rows as {
        id: string;
        hash: string;
      }[];
  }  
}