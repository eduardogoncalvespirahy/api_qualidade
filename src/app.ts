import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import routes from "./routes";
import swaggerDocument from "../swagger-output.json";
import { requestLogger } from "./middlewares/requestLogger.middleware";
import { swaggerAuth } from "./middlewares/swagger.middleware";

const app = express();

app.use(express.json());

// Popula req.cookies — necessário para o authMiddleware (cookie `token`) e
// para o /auth/refresh e /auth/logout (cookie `refreshToken`).
app.use(cookieParser());

app.use(
  "/api-docs",
  swaggerAuth,
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument),
);

app.use(helmet());

const isProd = process.env.NODE_ENV === "production";

const allowedOrigins = (
  process.env.CORS_ORIGIN ?? "http://localhost:4200,http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    // credentials:true exige um origin ESPECÍFICO (nunca "*"); o cors reflete
    // o origin da requisição quando permitido.
    origin: (origin, callback) => {
      // Requisições sem Origin (curl, Postman, same-origin) → libera.
      if (!origin) return callback(null, true);

      // Origins explicitamente permitidos.
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // DEV: aceita qualquer origin (localhost, IP da LAN, celular na rede…),
      // para não precisar cadastrar cada IP durante o desenvolvimento.
      if (!isProd) return callback(null, true);

      // PROD: bloqueia o que não estiver na allowlist.
      return callback(new Error(`Origin não permitido pelo CORS: ${origin}`));
    },
    credentials: true, // permite o navegador guardar/enviar os cookies httpOnly
  }),
);

// Loga requisição/resposta (morgan) e enfileira para gravação no Mongo
app.use(requestLogger);

app.use("/api", routes);

export default app;
