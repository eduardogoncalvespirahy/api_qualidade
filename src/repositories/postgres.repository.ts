import { PoolClient, QueryResult, QueryResultRow } from "pg";
import { pool } from "../config/database";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

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
        FROM ${SCHEMA_UNICO}.employees
        `
      );

      return result.rows as {
        id: string;
        hash: string;
      }[];
  }  
}