import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import routes from "./routes";
import swaggerDocument from "../swagger-output.json";
import { requestLogger } from "./middlewares/requestLogger.middleware";

const app = express();

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

// Loga requisição/resposta (morgan) e enfileira para gravação no Mongo
app.use(requestLogger);

app.use("/api", routes);

export default app;
