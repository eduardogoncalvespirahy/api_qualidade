import morgan from "morgan";
import { Request, Response, NextFunction, RequestHandler } from "express";

import { requestLogBuffer } from "../services/requestLog.buffer";
import { RequestLog } from "../models/requestLog.model";

const MAX_BODY_LENGTH = Number(process.env.REQUEST_LOG_MAX_BODY ?? 10000);

const SENSITIVE_KEYS = [
  "password",
  "senha",
  "senha_hash",
  "senhahash",
  "token",
  "refreshtoken",
  "authorization",
  "secret",
];

/** Redige recursivamente campos sensíveis (senhas, tokens, etc). */
function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        out[key] = "***";
      } else {
        out[key] = sanitize(val);
      }
    }
    return out;
  }

  return value;
}

/** Normaliza/trunca o corpo da resposta para um tamanho seguro. */
function normalizeBody(body: unknown): unknown {
  if (body === undefined || body === null) {
    return null;
  }

  try {
    if (Buffer.isBuffer(body)) {
      const text = body.toString("utf8");
      return text.length > MAX_BODY_LENGTH
        ? `${text.slice(0, MAX_BODY_LENGTH)}...[truncated]`
        : text;
    }

    if (typeof body === "string") {
      return body.length > MAX_BODY_LENGTH
        ? `${body.slice(0, MAX_BODY_LENGTH)}...[truncated]`
        : body;
    }

    const sanitized = sanitize(body);
    const json = JSON.stringify(sanitized);
    if (json && json.length > MAX_BODY_LENGTH) {
      return {
        _truncated: true,
        preview: `${json.slice(0, MAX_BODY_LENGTH)}...[truncated]`,
      };
    }
    return sanitized;
  } catch {
    return null;
  }
}

/**
 * Captura o corpo da requisição (saneado) e intercepta res.json/res.send
 * para guardar o corpo da resposta, que o morgan não enxerga por padrão.
 */
const captureBodies: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  (req as any).__reqBody = sanitize(req.body);

  const originalJson = res.json.bind(res);
  res.json = function (body?: any) {
    (res as any).__resBody = normalizeBody(body);
    return originalJson(body);
  } as Response["json"];

  const originalSend = res.send.bind(res);
  res.send = function (body?: any) {
    if ((res as any).__resBody === undefined) {
      (res as any).__resBody = normalizeBody(body);
    }
    return originalSend(body);
  } as Response["send"];

  next();
};

/** Monta o documento de log a partir dos tokens do morgan + req/res. */
const jsonFormat = (
  tokens: morgan.TokenIndexer<Request, Response>,
  req: Request,
  res: Response
): string => {
  const log: RequestLog = {
    timestamp: new Date(),
    method: tokens.method(req, res) ?? req.method,
    url: tokens.url(req, res) ?? req.originalUrl,
    status: Number(tokens.status(req, res)) || res.statusCode,
    responseTimeMs: Number(tokens["response-time"](req, res)) || 0,
    contentLength: Number(tokens.res(req, res, "content-length")) || 0,
    ip: tokens["remote-addr"](req, res) ?? req.ip ?? "",
    userAgent: tokens["user-agent"](req, res) ?? null,
    referrer: tokens.referrer(req, res) ?? null,
    userId: (req as any).user?.id ?? null,
    requestBody: (req as any).__reqBody ?? null,
    responseBody: (res as any).__resBody ?? null,
  };

  return JSON.stringify(log);
};

const stream: morgan.StreamOptions = {
  write: (line: string) => {
    try {
      const log = JSON.parse(line) as RequestLog;
      requestLogBuffer.push(log);
      // mantém também um log legível no console
      console.log(
        `${log.method} ${log.url} ${log.status} - ${log.responseTimeMs}ms`
      );
    } catch {
      process.stdout.write(line);
    }
  },
};

const morganMiddleware = morgan<Request, Response>(jsonFormat, {
  stream,
  // evita poluir os logs com as chamadas da documentação Swagger
  skip: (req) => req.originalUrl.startsWith("/api-docs"),
});

/**
 * Middleware de logging de requisição/resposta.
 * Usar em app.ts: `app.use(requestLogger)`
 */
export const requestLogger: RequestHandler[] = [captureBodies, morganMiddleware];
