import { pool } from "../config/database";
import { PaginatedResult } from "../models/paginate.model";
import {
  Employee,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
} from "../models/employee.model";
import { RedisRepository } from "./redis.repository";
import dotenv from "dotenv";

dotenv.config();

const SCHEMA_UNICO = String(process.env.schema_unico);
const SCHEMA_QUALIDADE = String(process.env.schema_qualidade);

const cache = new RedisRepository();

const CACHE_TTL = 60 * 60 * 24; // 24 horas

const cacheKeys = {
  byId: (id: string) => `employees:${id}`,

  byRegisterNumber: (registerNumber: number | string | null | undefined) =>
    `employees:register:${registerNumber}`,

  all: () => "employees:all",

  paginated: (page: number, limit: number) =>
    `employees:page:${page}:limit:${limit}`,

  listPattern: () => "employees:*",
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
  private async invalidateListCache(): Promise<void> {
    await cache.deleteByPattern(cacheKeys.listPattern());
  }

  private async invalidateEmployeeCache(employee: Employee): Promise<void> {
    await Promise.all([
      cache.delete(cacheKeys.byId(employee.id)),
      cache.delete(cacheKeys.byRegisterNumber(employee.registerNumber)),
    ]);
  }

  async create(dto: CreateEmployeeDTO): Promise<Employee> {
    const result = await pool.query<Employee>(
      `
      INSERT INTO ${SCHEMA_UNICO}.employees
      (
        id,
        company_number,
        register_number,
        registration_number,
        person_id,
        person_name,
        hire_date,
        dismissal_date,
        hash,
        employer_id,
        department_id,
        job_position_id,
        workstation_group_id,
        workshift_id,
        cost_center_id,
        synced_at
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14,$15,
        NOW()
      )
      ON CONFLICT (id)
      DO UPDATE SET
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
        synced_at = NOW()
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
      ],
    );

    const employee = result.rows[0];

    await Promise.all([
      cache.set(cacheKeys.byId(employee.id), employee, CACHE_TTL),
      cache.set(
        cacheKeys.byRegisterNumber(employee.registerNumber),
        employee,
        CACHE_TTL,
      ),
      this.invalidateListCache(),
    ]);

    return employee;
  }

  async findById(id: string): Promise<Employee | null> {
    const cacheKey = cacheKeys.byId(id);

    const cached = await cache.get<Employee>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<Employee>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_UNICO}.employees
      WHERE id = $1
      `,
      [id],
    );

    const employee = result.rows[0];

    if (!employee) {
      return null;
    }

    await cache.set(cacheKey, employee, CACHE_TTL);

    return employee;
  }

  async findByRegisterNumber(registerNumber: string): Promise<Employee | null> {
    const cacheKey = cacheKeys.byRegisterNumber(registerNumber);

    const cached = await cache.get<Employee>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    const result = await pool.query<Employee>(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_UNICO}.employees
      WHERE register_number = $1
      `,
      [registerNumber],
    );

    const employee = result.rows[0];

    if (!employee) {
      return null;
    }

    await cache.set(cacheKey, employee, CACHE_TTL);

    return employee;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Employee>> {
    const isPaginated =
      page !== undefined && limit !== undefined && page > 0 && limit > 0;

    const cacheKey = isPaginated
      ? cacheKeys.paginated(page, limit)
      : cacheKeys.all();

    const cached = await cache.get<PaginatedResult<Employee>>(cacheKey);

    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    let query = `
      SELECT ${SELECT_COLUMNS}
      FROM ${SCHEMA_UNICO}.employees
      ORDER BY register_number ASC
    `;

    const params: unknown[] = [];

    if (isPaginated) {
      query += `
        LIMIT $1
        OFFSET $2
      `;

      params.push(limit, (page - 1) * limit);
    }

    const [rowsResult, countResult] = await Promise.all([
      pool.query<Employee>(query, params),
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        FROM ${SCHEMA_UNICO}.employees
        `,
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    const response: PaginatedResult<Employee> = {
      data: rowsResult.rows,
      total,
      page: isPaginated ? page : null,
      limit: isPaginated ? limit : null,
      totalPages: isPaginated ? Math.ceil(total / limit) : null,
    };

    await cache.set(cacheKey, response, CACHE_TTL);

    return response;
  }

  async update(id: string, dto: UpdateEmployeeDTO): Promise<Employee | null> {
    const current = await this.findById(id);

    if (!current) {
      return null;
    }

    const result = await pool.query<Employee>(
      `
      UPDATE ${SCHEMA_UNICO}.employees
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
        synced_at = NOW()
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
      ],
    );

    const employee = result.rows[0];

    if (!employee) {
      return null;
    }

    await Promise.all([
      this.invalidateEmployeeCache(current),
      this.invalidateListCache(),
    ]);

    await Promise.all([
      cache.set(cacheKeys.byId(employee.id), employee, CACHE_TTL),
      cache.set(
        cacheKeys.byRegisterNumber(employee.registerNumber),
        employee,
        CACHE_TTL,
      ),
    ]);

    return employee;
  }

  async delete(id: string): Promise<Employee | null> {
    const employee = await this.findById(id);

    if (!employee) {
      return null;
    }

    await pool.query(
      `
      DELETE FROM ${SCHEMA_UNICO}.employees
      WHERE id = $1
      `,
      [id],
    );

    await Promise.all([
      this.invalidateEmployeeCache(employee),
      this.invalidateListCache(),
    ]);

    return employee;
  }
}
