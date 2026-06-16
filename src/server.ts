import dotenv from "dotenv";
import app from "./app";
import { RedisConnection } from "./config/redis";
import { MongoConnection } from "./config/mongo";

import { WorkerManager } from "./workes";

dotenv.config();

const HOST = String(process.env.HOST);
const PORT = Number(process.env.PORT);

if (!Number.isFinite(PORT)) {
  throw new Error("PORT deve ser um número válido.");
}

async function bootstrap() {
  try {
    await RedisConnection.connect();
    await MongoConnection.connect();

    app.listen(PORT, HOST, () => {
      console.log(`Servidor rodando na porta http://${HOST}:${PORT}/api`);
      console.log(`📚 API Documentation: http://${HOST}:${PORT}/api-docs`);    
      WorkerManager.start();
    });
  }catch (error) {
    console.error("Erro ao conectar com os serviços:", error);
    process.exit(1);
  }
};  

bootstrap();