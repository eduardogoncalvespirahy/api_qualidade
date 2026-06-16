import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  User,
  CreateUserDTO,
  UpdateUserDTO
} from "../models/user.model";
import { RedisRepository } from "./redis.repository";
import { EmployeeRepository } from "./employee.repository";

const cache = new RedisRepository();
const employee = new EmployeeRepository();

const CACHE_TTL = (60 * 60) * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `user:${id}`,
  byUsername: (username: string) => `user_username:${username}`,
  byEmail: (email: string) => `user_email:${email}`,
  byRegisterNumber: (registerNumber: number | string) => `user_register:${registerNumber}`,
  paginated: (page: number, limit: number) => `users:page:${page}:limit:${limit}`,
  paginatedPattern: () => "users:page:*",
};

const SELECT_COLUMNS = `
  id,
  employee_id    as "employeeId",
  username,
  email,
  status,
  data_criacao   as "dataCriacao",
  data_alteracao as "dataAlteracao"
`;

export class UserRepository {

  private async getRegisterNumber(employeeId: string): Promise<any> {
    const employeeEntity = await employee.findById(employeeId);
    const registerNumber = employeeEntity?.registerNumber;
    return registerNumber;
  }

  private async cacheUser(user: User): Promise<void> {
    await Promise.all([
      cache.set(cacheKeys.byId(user.id), user, CACHE_TTL),
      cache.set(cacheKeys.byUsername(user.username), user, CACHE_TTL),
      cache.set(cacheKeys.byEmail(user.email), user, CACHE_TTL),
      cache.set(cacheKeys.byRegisterNumber(await this.getRegisterNumber(user.employeeId)), user, CACHE_TTL)                
    ]);
  }

  private async invalidateUserCache(user: User): Promise<void> {
    await Promise.all([
      cache.delete(cacheKeys.byId(user.id)),
      cache.delete(cacheKeys.byUsername(user.username)),
      cache.delete(cacheKeys.byEmail(user.email)),
      cache.delete(cacheKeys.byRegisterNumber(await this.getRegisterNumber(user.employeeId))),
    ]);
  }

  async create(dto: CreateUserDTO): Promise<User> {
    const result = await pool.query<User>(
      `
      INSERT INTO teste.users
        (employee_id, username, email, status)
      VALUES ($1, $2, $3, COALESCE($4, 1))
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.employeeId, dto.username, dto.email, dto.status ?? null]
    );

    const user = result.rows[0];

    await Promise.all([
      this.cacheUser(user),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return user;
  }

  async findById(id: string): Promise<User | null> {
    const key = cacheKeys.byId(id);

    const cached = await cache.get<User>(key);
    if (cached) {
      console.log("Cache HIT user id:", id);
      return cached;
    }

    const result = await pool.query<User>(
      `SELECT ${SELECT_COLUMNS} FROM teste.users WHERE id = $1`,
      [id]
    );

    const user = result.rows[0];
    if (!user) {
      return null;
    }

    await cache.set(key, user, CACHE_TTL);
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    const key = cacheKeys.byUsername(username);

    const cached = await cache.get<User>(key);
    if (cached) {
      console.log("Cache HIT user username:", username);
      return cached;
    }

    const result = await pool.query<User>(
      `SELECT ${SELECT_COLUMNS} FROM teste.users WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];
    if (!user) {
      return null;
    }

    await cache.set(key, user, CACHE_TTL);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const key = cacheKeys.byEmail(email);

    const cached = await cache.get<User>(key);
    if (cached) {
      console.log("Cache HIT user email:", email);
      return cached;
    }

    const result = await pool.query<User>(
      `SELECT ${SELECT_COLUMNS} FROM teste.users WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return null;
    }

    await cache.set(key, user, CACHE_TTL);
    return user;
  }

  async findByRegisterNumber(registerNumber: number | string): Promise<User | null> {
    const key = cacheKeys.byRegisterNumber(registerNumber);

    const cached = await cache.get<User>(key);
    if (cached) {
      console.log("Cache HIT user register_number:", registerNumber);
      return cached;
    }

    const result = await pool.query<User>(
      `
      SELECT
        u.id,
        u.employee_id    as "employeeId",
        u.username,
        u.email,
        u.status,
        u.data_criacao   as "dataCriacao",
        u.data_alteracao as "dataAlteracao"
      FROM teste.users u
      JOIN teste.employees e ON e.id = u.employee_id
      WHERE e.register_number = $1
      ORDER BY u.id ASC
      LIMIT 1
      `,
      [registerNumber]
    );

    const user = result.rows[0];
    if (!user) {
      return null;
    }

    await cache.set(key, user, CACHE_TTL);
    return user;
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<User>> {
    const cacheKey = cacheKeys.paginated(page, limit);

    const cached = await cache.get<PaginatedResult<User>>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const offset = (page - 1) * limit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query<User>(
        `
        SELECT ${SELECT_COLUMNS}
        FROM teste.users
        ORDER BY data_criacao DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) as total FROM teste.users`
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<User> = {
      data: rowsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cache.set(cacheKey, response, CACHE_TTL);
    return response;
  }

  async update(id: string, dto: UpdateUserDTO): Promise<User | null> {
    const current = await this.findById(id);

    const result = await pool.query<User>(
      `
      UPDATE teste.users
      SET
        employee_id = COALESCE($2, employee_id),
        username = COALESCE($3, username),
        email = COALESCE($4, email),
        status = COALESCE($5, status),
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [id, dto.employeeId ?? null, dto.username ?? null, dto.email ?? null, dto.status ?? null]
    );

    const updated = result.rows[0] ?? null;
    if (!updated) {
      return null;
    }

    if (current) {
      await this.invalidateUserCache(current);
    }
    await this.cacheUser(updated);

    return updated;
  }

  async delete(id: string): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }

    await pool.query(`DELETE FROM teste.users WHERE id = $1`, [id]);
    await this.invalidateUserCache(user);

    return user;
  }
}
