import cron from "node-cron";
import { SeniorSyncService } from "../services/seniorPG.service";

export class SeniorSyncWorker {
  private readonly service = new SeniorSyncService();

  start() {
    console.log(
      "[SeniorSyncWorker] iniciado",
    );

    // executa na inicialização
    this.execute();

    // a cada 5 minutos
    cron.schedule(
      "*/5 * * * *",
      () => this.execute(),
    );
  }

  private async execute() {
    try {
      console.log(
        "[SeniorSyncWorker] sincronizando...",
      );

      const result =
        await this.service.execute();

      console.table(result);
    } catch (error) {
      console.error(
        "[SeniorSyncWorker]",
        error,
      );
    }
  }
}