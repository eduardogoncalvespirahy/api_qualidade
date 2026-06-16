import crypto from "crypto";
import { PoolClient } from "pg";

import { SeniorRepository } from "../repositories/senior.repository";
import { PostgresRepository } from "../repositories/postgres.repository";

export class SeniorSyncService {
    constructor(
        private readonly postgresRepository =
            new PostgresRepository(),

        private readonly seniorRepository =
            new SeniorRepository(),
    ) { }

    private createHash(data: unknown) {
        return crypto
            .createHash("sha256")
            .update(JSON.stringify(data))
            .digest("hex");
    }

    private chunk<T>(
        array: T[],
        size: number,
    ): T[][] {
        const chunks: T[][] = [];

        for (
            let i = 0;
            i < array.length;
            i += size
        ) {
            chunks.push(
                array.slice(i, i + size),
            );
        }

        return chunks;
    }

    private toDate(
      value: unknown,
    ): Date | null {
      if (!value) {
        return null;
      }

      try {
        return new Date(
          String(value)
            .split("/")
            .reverse()
            .join("-"),
        );
      } catch {
        return null;
      }
    }

    private toNumber(
      value: unknown,
    ): number | null {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return null;
      }

      const parsed = Number(value);

      return Number.isFinite(parsed)
        ? parsed
        : null;
    }

    mapEmployee(rowData: any) {
      const row = rowData.row;

      const obj = Object.fromEntries(
        row.map((i: any) => [
          i.name,
          i.value,
        ]),
      );

      return {
        id: obj.id,

        companyNumber:
          this.toNumber(
            obj.company_number,
          ),

        registerNumber:
          this.toNumber(
            obj.register_number,
          ),

        registrationNumber:
          this.toNumber(
            obj.registration_number,
          ),

        person: {
          id: obj.person_id,
          name: obj.person_name,
        },

        hireDate:
          this.toDate(
            obj.hire_date,
          ),

        dismissalDate: null,

        employeeType: {
          code:
            this.toNumber(
              obj.employee_type,
            ),

          enum:
            obj.employee_type_enum,

          description:
            obj.employee_type_description,
        },

        employer: {
          id: obj.employer_id,
          tradingName:
            obj.employer_trading_name,
        },

        department: {
          id: obj.department_id,
          name:
            obj.department_name,
        },

        jobPosition: {
          id:
            obj.jobposition_id,

          name:
            obj.jobposition_name,
        },

        workstationGroup: {
          id:
            obj.workstation_group_id,

          name:
            obj.workstation_group_name,
        },

        workshift: {
          id:
            obj.workshift_id,

          description:
            obj.workshift_description,
        },

        costCenter: {
          id:
            obj.costcenter_id,

          name:
            obj.costcenter_name,
        },

        riskPremium:
          this.toNumber(
            obj.risk_premium,
          ),

        insalubrityPremium:
          this.toNumber(
            obj.insalubrity_premium,
          ),

        processNumber:
          obj.process_number,

        isOccupyQuotaDisability:
          obj.is_occupy_quota_disability ===
          "true",

        hierarchyFilter:
          obj.hierarchy_filter,

        ext: obj.ext,
      };
    }

    private createPlaceholders(
      rowCount: number,
      columnsPerRow: number,
    ): string {
      return Array
        .from(
        { length: rowCount },
        (_, rowIndex) => {
            const start =
            rowIndex * columnsPerRow;

            const placeholders =
            Array.from(
                { length: columnsPerRow },
                (_, columnIndex) =>
                `$${start + columnIndex + 1}`,
            );

            return `(${placeholders.join(",")})`;
        },
        )
        .join(",");
    }

    async execute() {
        const startedAt =
            new Date();

        let inserted = 0;
        let updated = 0;

        try {
            const response =
                await this
                    .seniorRepository
                    .getEmployees();

            const employees =
                response.map((r: any) =>
                    this.mapEmployee(r),
                );

            const dbEmployees =
                await this
                    .postgresRepository
                    .findEmployeeHashes();

            const dbMap =
                new Map(
                    dbEmployees.map(
                        (employee) => [
                            employee.id,
                            employee,
                        ],
                    ),
                );

            const apiIds =
                new Set<string>();

            const employeesToUpsert:
                any[] = [];

            for (const employee of employees) {
                apiIds.add(employee.id);

                const hash =
                    this.createHash(employee);

                const current =
                    dbMap.get(employee.id);

                if (!current) {
                    inserted++;

                    employeesToUpsert.push({
                        ...employee,
                        hash,
                    });

                    continue;
                }

                if (
                    current.hash !== hash
                ) {
                    updated++;

                    employeesToUpsert.push({
                        ...employee,
                        hash,
                    });
                }
            }

            const removedIds =
                dbEmployees
                    .filter(
                        (employee) =>
                            !apiIds.has(
                                employee.id,
                            ),
                    )
                    .map(
                        (employee) =>
                            employee.id,
                    );

            const removed =
                removedIds.length;

            const client =
                await this
                    .postgresRepository
                    .getClient();

            try {
                await client.query(
                    "BEGIN",
                );

                await this.upsertEmployers(
                    client,
                    employeesToUpsert,
                );

                await this.upsertDepartments(
                    client,
                    employeesToUpsert,
                );

                await this.upsertJobPositions(
                    client,
                    employeesToUpsert,
                );

                await this.upsertCostCenters(
                    client,
                    employeesToUpsert,
                );

                await this.upsertWorkshifts(
                    client,
                    employeesToUpsert,
                );

                await this.upsertWorkstationGroups(
                    client,
                    employeesToUpsert,
                );

                await this.upsertEmployees(
                    client,
                    employeesToUpsert,
                );

                if (
                    removedIds.length
                ) {
                    await client.query(
                        `
                          DELETE FROM employees
                          WHERE id = ANY($1)
                        `,
                        [removedIds],
                    );
                }

                await client.query(
                    `
                      INSERT INTO teste.sync_logs (
                        started_at,
                        finished_at,
                        duration_ms,
                        inserted,
                        updated,
                        removed,
                        total_api,
                        total_before,
                        success
                      )
                      VALUES (
                        $1,$2,$3,
                        $4,$5,$6,
                        $7,$8,$9
                      )
                    `,
                    [
                        startedAt,
                        new Date(),
                        Date.now() -
                        startedAt.getTime(),
                        inserted,
                        updated,
                        removed,
                        employees.length,
                        dbEmployees.length,
                        true,
                    ],
                );

                await client.query(
                    "COMMIT",
                );
            } catch (error) {
                await client.query(
                    "ROLLBACK",
                );

                throw error;
            } finally {
                client.release();
            }

            return {
                inserted,
                updated,
                removed,
            };
        } catch (error) {
            throw error;
        }
    }

    private async upsertEmployers(
        client: PoolClient,
        employees: any[],
    ) {
        const unique = new Map();

        for (const employee of employees) {
            unique.set(
                employee.employer.id,
                employee.employer,
            );
        }

        const employers = [
            ...unique.values(),
        ];

        const BATCH_SIZE = Number(
          process.env.MONGO_BULK_BATCH_SIZE ?? 500,
        );

        const batches =
            this.chunk(employers, BATCH_SIZE);

        for (const batch of batches) {
            const params: any[] = [];

            batch.forEach((item) => {
                params.push(
                    item.id,
                    item.tradingName,
                );
            });

            const placeholders =
                this.createPlaceholders(
                    batch.length,
                    2,
                );

            await client.query(
                `
      INSERT INTO teste.employers (
        id,
        trading_name
      )
      VALUES
      ${placeholders}

      ON CONFLICT (id)
      DO UPDATE SET

      trading_name =
        EXCLUDED.trading_name
      `,
                params,
            );
        }
    }

    private async upsertDepartments(
        client: PoolClient,
        employees: any[],
    ) {
        const unique = new Map();

        for (const employee of employees) {
            unique.set(
                employee.department.id,
                employee.department,
            );
        }

        const departments = [
            ...unique.values(),
        ];

        const BATCH_SIZE = Number(
          process.env.MONGO_BULK_BATCH_SIZE ?? 500,
        );

        const batches =
            this.chunk(
                departments,
                BATCH_SIZE,
            );

        for (const batch of batches) {
            const params: any[] = [];

            batch.forEach((item) => {
                params.push(
                    item.id,
                    item.name,
                );
            });

            const placeholders =
                this.createPlaceholders(
                    batch.length,
                    2,
                );

            await client.query(
                `
      INSERT INTO teste.departments (
        id,
        name
      )
      VALUES
      ${placeholders}

      ON CONFLICT (id)
      DO UPDATE SET

      name =
        EXCLUDED.name
      `,
                params,
            );
        }
    }

    private async upsertJobPositions(
        client: PoolClient,
        employees: any[],
    ) {
        const unique = new Map();

        for (const employee of employees) {
            unique.set(
                employee.jobPosition.id,
                employee.jobPosition,
            );
        }

        const jobpositions = [
            ...unique.values(),
        ];

        const BATCH_SIZE = Number(
          process.env.MONGO_BULK_BATCH_SIZE ?? 500,
        );

        const batches =
            this.chunk(
                jobpositions,
                BATCH_SIZE,
            );

        for (const batch of batches) {
            const params: any[] = [];

            batch.forEach((item) => {
                params.push(
                    item.id,
                    item.name,
                );
            });

            const placeholders =
                this.createPlaceholders(
                    batch.length,
                    2,
                );

            await client.query(
                `
                INSERT INTO teste.job_positions (
                  id,
                  name
                )
                VALUES
                ${placeholders}

                ON CONFLICT (id)
                DO UPDATE SET

                name =
                  EXCLUDED.name
                `,
                params,
            );
        }
    }

    private async upsertCostCenters(
        client: PoolClient,
        employees: any[],
    ) {
        const unique = new Map();

        for (const employee of employees) {
            unique.set(
                employee.costCenter.id,
                employee.costCenter,
            );
        }

        const costCenters = [
            ...unique.values(),
        ];

        const BATCH_SIZE = Number(
          process.env.MONGO_BULK_BATCH_SIZE ?? 500,
        );

        const batches =
            this.chunk(
                costCenters,
                BATCH_SIZE,
            );

        for (const batch of batches) {
            const params: any[] = [];

            batch.forEach((item) => {
                params.push(
                    item.id,
                    item.name,
                );
            });

            const placeholders =
                this.createPlaceholders(
                    batch.length,
                    2,
                );

            await client.query(
                `
                INSERT INTO teste.cost_centers (
                  id,
                  name
                )
                VALUES
                ${placeholders}

                ON CONFLICT (id)
                DO UPDATE SET

                name =
                  EXCLUDED.name
                `,
                params,
            );
        }
    }

    private async upsertWorkshifts(
        client: PoolClient,
        employees: any[],
    ) {
        const unique = new Map();

        for (const employee of employees) {
            unique.set(
                employee.workshift.id,
                employee.workshift,
            );
        }

        const workshifts = [
            ...unique.values(),
        ];

        const BATCH_SIZE = Number(
          process.env.MONGO_BULK_BATCH_SIZE ?? 500,
        );

        const batches =
            this.chunk(
                workshifts,
                BATCH_SIZE,
            );

        for (const batch of batches) {
            const params: any[] = [];

            batch.forEach((item) => {
                params.push(
                    item.id,
                    item.description,
                );
            });

            const placeholders =
                this.createPlaceholders(
                    batch.length,
                    2,
                );

            await client.query(
                `
                INSERT INTO teste.workshifts (
                  id,
                  description
                )
                VALUES
                ${placeholders}

                ON CONFLICT (id)
                DO UPDATE SET

                description =
                  EXCLUDED.description
                `,
                params,
            );
        }
    }

    private async upsertWorkstationGroups(
        client: PoolClient,
        employees: any[],
    ) {
        const unique = new Map();

        for (const employee of employees) {
            unique.set(
                employee.workstationGroup.id,
                employee.workstationGroup,
            );
        }

        const workstationGroups = [
            ...unique.values(),
        ];

        const BATCH_SIZE = Number(
          process.env.MONGO_BULK_BATCH_SIZE ?? 500,
        );

        const batches =
            this.chunk(
                workstationGroups,
                BATCH_SIZE,
            );

        for (const batch of batches) {
            const params: any[] = [];

            batch.forEach((item) => {
                params.push(
                    item.id,
                    item.name,
                );
            });

            const placeholders =
                this.createPlaceholders(
                    batch.length,
                    2,
                );

            await client.query(
                `
                INSERT INTO teste.workstation_groups (
                  id,
                  name
                )
                VALUES
                ${placeholders}

                ON CONFLICT (id)
                DO UPDATE SET

                name =
                  EXCLUDED.name
                `,
                params,
            );
        }
    }

    private async upsertEmployees(
      client: PoolClient,
      employees: any[],
    ) {

      const BATCH_SIZE = Number(
        process.env.MONGO_BULK_BATCH_SIZE ?? 500,
      );    

      const batches = this.chunk(
        employees,
        BATCH_SIZE,
      );

      for (const batch of batches) {
        const params: unknown[] = [];

        batch.forEach((employee) => {
          params.push(
            employee.id ?? null,

            employee.companyNumber ?? null,
            employee.registerNumber ?? null,
            employee.registrationNumber ?? null,

            employee.person?.id ?? null,
            employee.person?.name ?? null,

            employee.hireDate ?? null,
            employee.dismissalDate ?? null,

            employee.hash ?? null,

            employee.employer?.id ?? null,
            employee.department?.id ?? null,

            employee.jobPosition?.id ?? null,
            employee.workstationGroup?.id ?? null,
            employee.workshift?.id ?? null,
            employee.costCenter?.id ?? null,
          );
        });

        const placeholders =
          this.createPlaceholders(
            batch.length,
            15,
          );

        await client.query(
          `
          INSERT INTO teste.employees (
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
            cost_center_id
          )
          VALUES
          ${placeholders}

          ON CONFLICT (id)
          DO UPDATE SET

            company_number =
              EXCLUDED.company_number,

            register_number =
              EXCLUDED.register_number,

            registration_number =
              EXCLUDED.registration_number,

            person_id =
              EXCLUDED.person_id,

            person_name =
              EXCLUDED.person_name,

            hire_date =
              EXCLUDED.hire_date,

            dismissal_date =
              EXCLUDED.dismissal_date,

            employer_id =
              EXCLUDED.employer_id,

            department_id =
              EXCLUDED.department_id,

            job_position_id =
              EXCLUDED.job_position_id,

            workstation_group_id =
              EXCLUDED.workstation_group_id,

            workshift_id =
              EXCLUDED.workshift_id,

            cost_center_id =
              EXCLUDED.cost_center_id,

            hash =
              EXCLUDED.hash,

            synced_at = NOW()
          `,
          params,
        );
      }
    }
}