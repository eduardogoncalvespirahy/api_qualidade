import { RequestLog } from "../models/requestLog.model";

/**
 * Fila em memória que acumula os logs de requisição/resposta produzidos
 * pelo middleware morgan. O RequestLogWorker drena esta fila periodicamente
 * e grava os registros no MongoDB em lote (evitando uma escrita por request).
 */
class RequestLogBuffer {
  private queue: RequestLog[] = [];

  // limite de segurança para não crescer indefinidamente caso o Mongo
  // esteja indisponível por muito tempo
  private readonly maxSize = Number(process.env.REQUEST_LOG_BUFFER_MAX ?? 10000);

  push(entry: RequestLog): void {
    if (this.queue.length >= this.maxSize) {
      // descarta o mais antigo para preservar memória
      this.queue.shift();
    }
    this.queue.push(entry);
  }

  /** Remove e retorna todos os registros acumulados. */
  drain(): RequestLog[] {
    if (!this.queue.length) {
      return [];
    }
    const items = this.queue;
    this.queue = [];
    return items;
  }

  size(): number {
    return this.queue.length;
  }
}

export const requestLogBuffer = new RequestLogBuffer();
