import dotenv from "dotenv";
import cron from "node-cron";
import { SeniorSyncService } from "../services/seniorPostgre.service";

dotenv.config();

const TIME_CRON = String(process.env.TIME_CRON);

export class SeniorSyncWorker {
  private readonly service = new SeniorSyncService();
  private task?: ReturnType<typeof cron.schedule>;
  private running = false;

  start() {
    console.log("[SeniorSyncWorker] iniciado");

    // executa na inicialização (sem bloquear o boot)
    void this.execute();

    // a cada 5 minutos
    this.task = cron.schedule(TIME_CRON, () => this.execute(), {
      timezone: "America/Sao_Paulo",
    });

    // node-cron v4: se o tick for "perdido" (event loop ocupado naquele
    // instante), o agendamento pode ser pulado. Aqui reexecutamos assim
    // que possível — a guarda `running` evita rodar duas vezes.
    this.task.on("execution:missed", () => {
      console.warn("[SeniorSyncWorker] tick perdido — reexecutando");
      void this.execute();
    });
  }

  private async execute() {
    // evita sobreposição: se a execução anterior ainda não terminou,
    // ignora este disparo (não empilha sincronizações).
    if (this.running) {
      console.warn(
        "[SeniorSyncWorker] execução anterior ainda em andamento — ignorando este disparo",
      );
      return;
    }

    this.running = true;
    const startedAt = Date.now();

    try {
      console.log("[SeniorSyncWorker] sincronizando...");

      const result = await this.service.execute();

      console.table(result);
      console.log(
        `[SeniorSyncWorker] concluído em ${Date.now() - startedAt}ms`,
      );
    } catch (error) {
      console.error("[SeniorSyncWorker]", error);
    } finally {
      this.running = false;
    }
  }
}
