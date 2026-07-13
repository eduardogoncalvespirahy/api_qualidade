import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import dotenv from "dotenv";
import { payloadUserLogin } from "../models/auth.model";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_COOKIE = "token";

/** Request com cookies parseados (requer app.use(cookieParser())). */
type RequestWithCookies = Request & { cookies?: Record<string, string> };

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // 1) cookie httpOnly (esquema atual) → 2) header Authorization (fallback/migração)
  const cookieToken = (req as RequestWithCookies).cookies?.[ACCESS_COOKIE];

  let token: string | undefined = cookieToken;

  if (!token) {
    const authorization = req.headers.authorization;

    if (authorization) {
      const [scheme, headerToken] = authorization.split(" ");

      if (scheme === "Bearer" && headerToken) {
        token = headerToken;
      }
    }
  }

  if (!token) {
    return res.status(401).json({
      message: "Token não informado",
    });
  }

  try {
    const payload = verify(token, JWT_SECRET);

    req.user = payload as payloadUserLogin;

    next();
  } catch {
    return res.status(401).json({
      message: "Token inválido",
    });
  }
}
