import { MongoRepository } from "./mongo.repository";
import { RequestLog } from "../models/requestLog.model";

const DATABASE = process.env.MONGO_LOG_DB ?? "log";
const COLLECTION = process.env.MONGO_LOG_COLLECTION ?? "request_logs";

export class RequestLogRepository {
  private readonly mongo = new MongoRepository();

  /** Insere os logs em lote (uma única ida ao banco). */
  async insertMany(logs: RequestLog[]) {
    if (!logs.length) {
      return;
    }

    return this.mongo.bulkWrite<RequestLog>(
      DATABASE,
      COLLECTION,
      logs.map((document) => ({
        insertOne: { document },
      }))
    );
  }

  /** Lista os logs mais recentes (útil para auditoria/consulta). */
  async findRecent(limit: number = 100): Promise<RequestLog[]> {
    return this.mongo.findMany<RequestLog>(
      DATABASE,
      COLLECTION,
      {},
      {
        sort: { timestamp: -1 },
        limit,
      }
    );
  }
}
