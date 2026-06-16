import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Employee,
  CreateEmployeeDTO,
  UpdateEmployeeDTO
} from "../models/employee.model";
import { RedisRepository } from "./redis.repository";

const cache = new RedisRepository();

const CACHE_TTL = (60 * 60) * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `employees:${id}`,
  byRegisterNumber: (registerNumber: number | string | undefined | null) => `user_register:${registerNumber}`,  
  paginated: (page: number, limit: number) => `employees:page:${page}:limit:${limit}`,
  paginatedPattern: () => "employees:page:*",
};

const SELECT_COLUMNS = `
  id,
  company_number       as "companyNumber",
  register_number      as "registerNumber",
  registration_number  as "registrationNumber",
  person_id            as "personId",
  person_name          as "personName",
  hire_date            as "hireDate",
  dismissal_date       as "dismissalDate",
  hash,
  employer_id          as "employerId",
  department_id        as "departmentId",
  job_position_id      as "jobPositionId",
  workstation_group_id as "workstationGroupId",
  workshift_id         as "workshiftId",
  cost_center_id       as "costCenterId",
  synced_at            as "syncedAt"
`;

export class EmployeeRepository {
  async create(dto: CreateEmployeeDTO): Promise<Employee> {
    const result = await pool.query<Employee>(
      `
      INSERT INTO teste.employees
        (id, company_number, register_number, registration_number,
         person_id, person_name, hire_date, dismissal_date, hash,
         employer_id, department_id, job_position_id,
         workstation_group_id, workshift_id, cost_center_id, synced_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, now())
      ON CONFLICT (id) DO UPDATE SET
        company_number = EXCLUDED.company_number,
        register_number = EXCLUDED.register_number,
        registration_number = EXCLUDED.registration_number,
        person_id = EXCLUDED.person_id,
        person_name = EXCLUDED.person_name,
        hire_date = EXCLUDED.hire_date,
        dismissal_date = EXCLUDED.dismissal_date,
        hash = EXCLUDED.hash,
        employer_id = EXCLUDED.employer_id,
        department_id = EXCLUDED.department_id,
        job_position_id = EXCLUDED.job_position_id,
        workstation_group_id = EXCLUDED.workstation_group_id,
        workshift_id = EXCLUDED.workshift_id,
        cost_center_id = EXCLUDED.cost_center_id,
        synced_at = now()
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        dto.id,
        dto.companyNumber ?? null,
        dto.registerNumber ?? null,
        dto.registrationNumber ?? null,
        dto.personId ?? null,
        dto.personName ?? null,
        dto.hireDate ?? null,
        dto.dismissalDate ?? null,
        dto.hash ?? null,
        dto.employerId ?? null,
        dto.departmentId ?? null,
        dto.jobPositionId ?? null,
        dto.workstationGroupId ?? null,
        dto.workshiftId ?? null,
        dto.costCenterId ?? null,
      ]
    );

    const row = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(row.id), row, CACHE_TTL),
      cache.set(cacheKeys.byRegisterNumber(row.registerNumber), row, CACHE_TTL),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return row;
  }

  async findById(id: string): Promise<Employee | null> {
    const key = cacheKeys.byId(id);

    const cached = await cache.get<Employee>(key);
    if (cached) {
      console.log("Cache HIT employees:", id);
      return cached;
    }

    const result = await pool.query<Employee>(
      `SELECT ${SELECT_COLUMNS} FROM teste.employees WHERE id = $1`,
      [id]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    await cache.set(key, row, CACHE_TTL);
    return row;
  }

  async findByRegisterNumber(registerNumber: string): Promise<Employee | null> {
    const key = cacheKeys.byRegisterNumber(registerNumber);

    const cached = await cache.get<Employee>(key);
    if (cached) {
      console.log("Cache HIT employees:", registerNumber);
      return cached;
    }

    const result = await pool.query<Employee>(
      `SELECT ${SELECT_COLUMNS} FROM teste.employees WHERE register_number = $1`,
      [registerNumber]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    await cache.set(key, row, CACHE_TTL);
    return row;
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Employee>> {
    const cacheKey = cacheKeys.paginated(page, limit);

    const cached = await cache.get<PaginatedResult<Employee>>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const offset = (page - 1) * limit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query<Employee>(
        `
        SELECT ${SELECT_COLUMNS}
        FROM teste.employees
        ORDER BY register_number ASC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) as total FROM teste.employees`
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Employee> = {
      data: rowsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cache.set(cacheKey, response, CACHE_TTL);
    return response;
  }

  async update(id: string, dto: UpdateEmployeeDTO): Promise<Employee | null> {
    const current = await this.findById(id);

    const result = await pool.query<Employee>(
      `
      UPDATE teste.employees
      SET
        company_number = COALESCE($2, company_number),
        register_number = COALESCE($3, register_number),
        registration_number = COALESCE($4, registration_number),
        person_id = COALESCE($5, person_id),
        person_name = COALESCE($6, person_name),
        hire_date = COALESCE($7, hire_date),
        dismissal_date = COALESCE($8, dismissal_date),
        hash = COALESCE($9, hash),
        employer_id = COALESCE($10, employer_id),
        department_id = COALESCE($11, department_id),
        job_position_id = COALESCE($12, job_position_id),
        workstation_group_id = COALESCE($13, workstation_group_id),
        workshift_id = COALESCE($14, workshift_id),
        cost_center_id = COALESCE($15, cost_center_id),
        synced_at = now()
      WHERE id = $1
      RETURNING ${SELECT_COLUMNS}
      `,
      [
        id,
        dto.companyNumber ?? null,
        dto.registerNumber ?? null,
        dto.registrationNumber ?? null,
        dto.personId ?? null,
        dto.personName ?? null,
        dto.hireDate ?? null,
        dto.dismissalDate ?? null,
        dto.hash ?? null,
        dto.employerId ?? null,
        dto.departmentId ?? null,
        dto.jobPositionId ?? null,
        dto.workstationGroupId ?? null,
        dto.workshiftId ?? null,
        dto.costCenterId ?? null,
      ]
    );

    const row = result.rows[0] ?? null;
    if (!row) {
      return null;
    }

    if (current) {
      await Promise.all([
        cache.delete(cacheKeys.byId(id)),
        cache.delete(cacheKeys.byRegisterNumber(current.registerNumber)),
        cache.deleteByPattern(cacheKeys.paginatedPattern()),
      ]);
    }

    await Promise.all([
      cache.set(cacheKeys.byId(id), row, CACHE_TTL),
      cache.set(cacheKeys.byRegisterNumber(dto.companyNumber), row, CACHE_TTL),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return row;
  }

  async delete(id: string): Promise<Employee | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    await pool.query(`DELETE FROM teste.employees WHERE id = $1`, [id]);

    await Promise.all([
      cache.delete(cacheKeys.byId(id)),
      cache.delete(cacheKeys.byRegisterNumber(existing.registerNumber)),
      cache.deleteByPattern(cacheKeys.paginatedPattern()),
    ]);

    return existing;
  }
}
