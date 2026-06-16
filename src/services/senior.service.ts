import crypto from "crypto";
import { MongoRepository } from "../repositories/mongo.repository";
import { SeniorRepository } from "../repositories/senior.repository";
import { EmployeeDocument, EmployeeHash } from "../models/senior.model";

const DATABASE = "hcm";
const COLLECTION = "employees";

export class SeniorSyncService {
  constructor(
    private readonly mongoRepository = new MongoRepository(),
    private readonly seniorRepository = new SeniorRepository(),
  ) {}

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

  mapEmployee(rowData: any) {
    const row = rowData.row;

    const obj = Object.fromEntries(
        row.map((i: any) => [i.name, i.value])
    );

    return {
        _id: obj.id,

        companyNumber: Number(obj.company_number),

        registerNumber: Number(obj.register_number),

        registrationNumber: Number(obj.registration_number),

        person: {
        id: obj.person_id,
        name: obj.person_name
        },

        hireDate: obj.hire_date
        ? new Date(
            obj.hire_date.split("/").reverse().join("-")
            )
        : null,

        dismissalDate: null,

        employeeType: {
        code: Number(obj.employee_type),
        enum: obj.employee_type_enum,
        description: obj.employee_type_description
        },

        employer: {
        id: obj.employer_id,
        tradingName: obj.employer_trading_name
        },

        department: {
        id: obj.department_id,
        name: obj.department_name
        },

        jobPosition: {
        id: obj.jobposition_id,
        name: obj.jobposition_name
        },

        workstationGroup: {
        id: obj.workstation_group_id,
        name: obj.workstation_group_name
        },

        workshift: {
        id: obj.workshift_id,
        description: obj.workshift_description
        },

        costCenter: {
        id: obj.costcenter_id,
        name: obj.costcenter_name
        },

        riskPremium: Number(obj.risk_premium),

        insalubrityPremium: Number(obj.insalubrity_premium),

        processNumber: obj.process_number,

        isOccupyQuotaDisability:
        obj.is_occupy_quota_disability === "true",

        hierarchyFilter: obj.hierarchy_filter,

        ext: obj.ext
    };
  }

  async execute() {

    const startedAt = new Date();    
    try {

      const response =
        await this.seniorRepository.getEmployees();

      const employees =
        response.map((rowData: any) => this.mapEmployee(rowData));

      const mongoEmployees =
        await this.mongoRepository
          .findManyProjection<
            EmployeeDocument,
            EmployeeHash
          >(
            DATABASE,
            COLLECTION,
            {},
            {
              _id: 1,
              hash: 1,
            },
          );

      const mongoMap = new Map(
        mongoEmployees.map((item) => [
          item._id,
          item,
        ]),
      );

      const apiIds = new Set<string>();

      const operations: any[] = [];

      let inserted = 0;
      let updated = 0;

      for (const employee of employees) {
        apiIds.add(employee._id);

        const hash =
          this.createHash(employee);

        const current =
          mongoMap.get(employee._id);

        if (!current) {
          inserted++;

          operations.push({
            insertOne: {
              document: {
                ...employee,
                hash,
                syncedAt: new Date(),
              },
            },
          });

          continue;
        }

        if (current.hash !== hash) {
          updated++;

          operations.push({
            updateOne: {
              filter: {
                _id: employee._id,
              },
              update: {
                $set: {
                  ...employee,
                  hash,
                  syncedAt: new Date(),
                },
              },
            },
          });
        }
      }

      const removedIds =
        mongoEmployees
          .filter(
            (employee) =>
              !apiIds.has(employee._id.toString()),
          )
          .map((employee) => employee._id.toString());

      const removed =
        removedIds.length;

      if (removedIds.length) {
        operations.push({
          deleteMany: {
            filter: {
              _id: {
                $in: removedIds,
              },
            },
          },
        });
      }

      const BATCH_SIZE = Number(
        process.env.MONGO_BULK_BATCH_SIZE ?? 1000,
      );

      const batches = this.chunk(
        operations,
        BATCH_SIZE,
      );

      for (const batch of batches) {
        await this.mongoRepository.bulkWrite(
          DATABASE,
          COLLECTION,
          batch,
        );
      }

      // em paralelo, mais rapido porem mais custoso para o banco, avaliar qual estrategia é melhor...
      // await Promise.all(
      //   this.chunk(
      //     operations, 
      //     BATCH_SIZE
      //   ).map(
      //     (batch) =>
      //       this.mongoRepository.bulkWrite(
      //         DATABASE,
      //         COLLECTION,
      //         batch,
      //       ),
      //   ),
      // );

      const finishedAt = new Date();

      await this.mongoRepository.insertOne(
        DATABASE,
        "sync_logs",
        {
          startedAt,
          finishedAt,
          durationMs:
            finishedAt.getTime() -
            startedAt.getTime(),

          inserted,
          updated,
          removed,

          totalApi: employees.length,
          totalMongoBefore:
            mongoEmployees.length,

          success: true,
        },
      );

      return {
        inserted,
        updated,
        removed,
        totalApi: employees.length,
      };

    } catch (error) {

      const finishedAt = new Date();

      await this.mongoRepository.insertOne(
        DATABASE,
        "sync_logs",
        {
          startedAt,
          finishedAt,
          durationMs:
            finishedAt.getTime() -
            startedAt.getTime(),

          inserted: 0,
          updated: 0,
          removed: 0,

          totalApi: 0,
          totalMongoBefore: 0,

          success: false,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      throw error;
    
    }      
  }
}