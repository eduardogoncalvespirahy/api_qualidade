import { pool } from "../config/database";
import { CredentialRole } from "../models/credentialRole.model";

export class CredentialRoleRepository {
  async create(credentialId: string, roleId: string): Promise<CredentialRole> {
    const result = await pool.query<CredentialRole>(
      `
      INSERT INTO teste.credentials_roles (credential_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (credential_id, role_id) DO NOTHING
      RETURNING credential_id as "credentialId", role_id as "roleId"
      `,
      [credentialId, roleId]
    );

    return result.rows[0] ?? { credentialId, roleId };
  }

  async findByCredential(credentialId: string): Promise<CredentialRole[]> {
    const result = await pool.query<CredentialRole>(
      `
      SELECT credential_id as "credentialId", role_id as "roleId"
      FROM teste.credentials_roles
      WHERE credential_id = $1
      `,
      [credentialId]
    );
    return result.rows;
  }

  async findRoleNamesByCredential(credentialId: string): Promise<string[]> {
    const result = await pool.query<{ nome: string }>(
      `
      SELECT r.nome
      FROM teste.credentials_roles cr
      JOIN teste.roles r ON r.id = cr.role_id
      WHERE cr.credential_id = $1
      `,
      [credentialId]
    );
    return result.rows.map((r) => r.nome);
  }

  async delete(credentialId: string, roleId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM teste.credentials_roles WHERE credential_id = $1 AND role_id = $2`,
      [credentialId, roleId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
