import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import { User, CreateUserDTO, UpdateUserDTO, UserProfile } from "../models/user.model";
import { RedisRepository } from "./redis.repository";
import { EmployeeRepository } from "./employee.repository";

const cache = new RedisRepository();
const employee = new EmployeeRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  ByIdUserProfile: (id: string) => `users_profile:${id}`,

  byId: (id: string) => `users:${id}`,

  byUsername: (username: string) => `users:username:${username}`,

  byEmail: (email: string) => `users:email:${email}`,

  byRegisterNumber: (registerNumber: string | number) =>
    `users:register:${registerNumber}`,

  all: () => "users:all",

  paginated: (page: number, limit: number) =>
    `users:page:${page}:limit:${limit}`,

  listPattern: () => "users:*",
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
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  private async getRegisterNumber(
    employeeId: string,
  ): Promise<string | number | null> {
    const employeeEntity = await employee.findById(employeeId);

    return employeeEntity?.registerNumber ?? null;
  }

  private async cacheUser(user: User): Promise<void> {
    const registerNumber = await this.getRegisterNumber(user.employeeId);

    const operations: Promise<any>[] = [
      cache.set(cacheKeys.byId(user.id), user, CACHE_TTL),
      cache.set(cacheKeys.byUsername(user.username), user, CACHE_TTL),
      cache.set(cacheKeys.byEmail(user.email), user, CACHE_TTL),
    ];

    if (registerNumber) {
      operations.push(
        cache.set(cacheKeys.byRegisterNumber(registerNumber), user, CACHE_TTL),
      );
    }

    await Promise.all(operations);
  }

  private async invalidateUserCache(user: User): Promise<void> {
    const registerNumber = await this.getRegisterNumber(user.employeeId);

    const operations: Promise<any>[] = [
      cache.delete(cacheKeys.byId(user.id)),
      cache.delete(cacheKeys.byUsername(user.username)),
      cache.delete(cacheKeys.byEmail(user.email)),
    ];

    if (registerNumber) {
      operations.push(cache.delete(cacheKeys.byRegisterNumber(registerNumber)));
    }

    await Promise.all(operations);
  }

  async create(dto: CreateUserDTO): Promise<User> {
    const result = await pool.query<User>(
      `
      INSERT INTO teste.users
      (
        employee_id,
        username,
        email,
        status
      )
      VALUES
      (
        $1,
        $2,
        $3,
        COALESCE($4, 1)
      )
      RETURNING ${SELECT_COLUMNS}
      `,
      [dto.employeeId, dto.username, dto.email, dto.status ?? null],
    );

    const user = result.rows[0];

    await Promise.all([this.cacheUser(user), this.invalidateListCache()]);

    return user;
  }

  async findByIdUserProfile(id: string): Promise<UserProfile | null> {
    const cacheKey = cacheKeys.ByIdUserProfile(id);

    const cached = await cache.get<UserProfile>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<UserProfile>(
      `
      SELECT U.ID AS "userId",
             U.USERNAME AS "userUsername",
             U.EMAIL AS "userEmail",
             U.STATUS AS "userStatus",
             EE.ID AS "employeeId",
             EE.PERSON_NAME AS "employeeNome",
             EE.REGISTER_NUMBER AS "employeeMatricula",
             EE.HIRE_DATE AS "employeeDataAdmissao",
             ER.ID AS "employerId",
             LO.ID AS "locationId",
             LO.NOME AS "locationName",
             DE.ID AS "departmentId",
             DE.NAME AS "departmentNome",
             JO.ID AS "jobPositionId",
             JO.NAME AS "jobPositionNome",
             WG.ID AS "workstationGroupId",
             WG.NAME AS "workstationGroupNome",
             WS.ID AS "workshiftId",
             WS.DESCRIPTION AS "workshiftDescricao",
             CC.ID AS "costCenterId",
             CC.NAME AS "costCenterNome",
             EE.SYNCED_AT AS "ultimaSincronizacao"
        FROM TESTE.USERS U
        JOIN TESTE.EMPLOYEES EE ON EE.ID::TEXT = U.EMPLOYEE_ID::TEXT
        JOIN TESTE.EMPLOYERS ER ON ER.ID::TEXT = EE.EMPLOYER_ID::TEXT
        JOIN TESTE.LOCATIONS LO ON LO.EMPLOYER_ID::TEXT = EE.EMPLOYER_ID::TEXT
        JOIN TESTE.DEPARTMENTS DE ON DE.ID::TEXT = EE.DEPARTMENT_ID::TEXT
        JOIN TESTE.JOB_POSITIONS JO ON JO.ID::TEXT = EE.JOB_POSITION_ID::TEXT
        JOIN TESTE.WORKSTATION_GROUPS WG ON WG.ID::TEXT = EE.WORKSTATION_GROUP_ID::TEXT
        JOIN TESTE.WORKSHIFTS WS ON WS.ID::TEXT = EE.WORKSHIFT_ID::TEXT
        JOIN TESTE.COST_CENTERS CC ON CC.ID::TEXT = EE.COST_CENTER_ID::TEXT
       WHERE U.STATUS = 1 AND U.ID = $1
      `,
      [id],
    );

    const userProfile = result.rows[0] as UserProfile;

    if (!userProfile) {
      return null;
    }

    await Promise.all([cache.set(cacheKeys.ByIdUserProfile(userProfile.userId), userProfile, CACHE_TTL)]);

    return userProfile;
  }

  async findById(id: string): Promise<User | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<User>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<User>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.users
      WHERE id = $1
      `,
      [id],
    );

    const user = result.rows[0];

    if (!user) {
      return null;
    }

    await this.cacheUser(user);

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    const cacheKey = cacheKeys.byUsername(username);

    const cached = await cache.get<User>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<User>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.users
      WHERE username = $1
      `,
      [username],
    );

    const user = result.rows[0];

    if (!user) {
      return null;
    }

    await this.cacheUser(user);

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = cacheKeys.byEmail(email);

    const cached = await cache.get<User>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<User>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM teste.users
      WHERE email = $1
      `,
      [email],
    );

    const user = result.rows[0];

    if (!user) {
      return null;
    }

    await this.cacheUser(user);

    return user;
  }

  async findByRegisterNumber(
    registerNumber: string | number,
  ): Promise<User | null> {
    const cacheKey = cacheKeys.byRegisterNumber(registerNumber);

    const cached = await cache.get<User>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
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
      INNER JOIN teste.employees e
        ON e.id = u.employee_id
      WHERE e.register_number = $1
      LIMIT 1
      `,
      [registerNumber],
    );

    const user = result.rows[0];

    if (!user) {
      return null;
    }

    await this.cacheUser(user);

    return user;
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResult<User>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<User>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM teste.users
      ORDER BY data_criacao DESC
    `;

    const params: any[] = [];

    if (isPaginated) {
      query += `
        LIMIT $1
        OFFSET $2
      `;

      params.push(limit, (page - 1) * limit);
    }

    const [rowsResult, countResult] = await Promise.all([
      pool.query<User>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM teste.users
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<User> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
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
      [
        id,
        dto.employeeId ?? null,
        dto.username ?? null,
        dto.email ?? null,
        dto.status ?? null,
      ],
    );

    const updated = result.rows[0];

    if (!updated) {
      return null;
    }

    if (current) {
      await this.invalidateUserCache(current);
    }

    await Promise.all([this.cacheUser(updated), this.invalidateListCache()]);

    return updated;
  }

  async delete(id: string): Promise<User | null> {
    const user = await this.findById(id);

    if (!user) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM teste.users
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      this.invalidateUserCache(user),
      this.invalidateListCache(),
    ]);

    return user;
  }
}
