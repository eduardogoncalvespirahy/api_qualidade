import { SeniorSyncWorker } from "./senior.worker";
import { RequestLogWorker } from "./requestLog.worker";

export class WorkerManager {
  static start() {
    new SeniorSyncWorker().start();
    new RequestLogWorker().start();

    console.log(
      "[WorkerManager] workers iniciados",
    );
  }
}
