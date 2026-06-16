import cron from "node-cron";

import { requestLogBuffer } from "../services/requestLog.buffer";
import { RequestLogRepository } from "../repositories/requestLog.repository";

export class RequestLogWorker {
  private readonly repository = new RequestLogRepository();
  private flushing = false;

  // intervalo do flush (cron com segundos). Padrão: a cada 10 segundos.
  private readonly schedule = process.env.REQUEST_LOG_FLUSH_CRON ?? "*/10 * * * * *";

  start() {
    console.log("[RequestLogWorker] iniciado");

    cron.schedule(this.schedule, () => this.flush());

    // garante o flush dos logs pendentes ao encerrar a aplicação
    const gracefulFlush = async () => {
      await this.flush();
      process.exit(0);
    };
    process.once("SIGINT", gracefulFlush);
    process.once("SIGTERM", gracefulFlush);
  }

  private async flush() {
    if (this.flushing) {
      return;
    }

    const batch = requestLogBuffer.drain();
    if (!batch.length) {
      return;
    }

    this.flushing = true;

    try {
      await this.repository.insertMany(batch);
      console.log(`[RequestLogWorker] ${batch.length} log(s) gravado(s) no Mongo`);
    } catch (error) {
      console.error("[RequestLogWorker]", error);
      // devolve os registros ao buffer para tentar novamente no próximo ciclo
      batch.forEach((log) => requestLogBuffer.push(log));
    } finally {
      this.flushing = false;
    }
  }
}
