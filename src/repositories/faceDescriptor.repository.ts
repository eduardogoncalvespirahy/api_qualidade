import { pool } from "../config/database";

export class FaceDescriptorRepository {
  /** Cria/atualiza o descritor facial do usuário. */
  async upsert(userId: string, descriptor: number[]): Promise<void> {
    await pool.query(
      `
      INSERT INTO teste.face_descriptors (user_id, descriptor, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        descriptor = EXCLUDED.descriptor,
        updated_at = NOW()
      `,
      [userId, JSON.stringify(descriptor)],
    );
  }

  /** Retorna o descritor (vetor) do usuário, ou null se não houver. */
  async findByUserId(userId: string): Promise<number[] | null> {
    const result = await pool.query<{ descriptor: number[] | string }>(
      `SELECT descriptor FROM teste.face_descriptors WHERE user_id = $1`,
      [userId],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    // jsonb costuma voltar já parseado; trata os dois casos
    return typeof row.descriptor === "string"
      ? (JSON.parse(row.descriptor) as number[])
      : row.descriptor;
  }

  async delete(userId: string): Promise<void> {
    await pool.query(
      `DELETE FROM teste.face_descriptors WHERE user_id = $1`,
      [userId],
    );
  }
}
