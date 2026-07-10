import { Request, Response, NextFunction } from "express";
import {verify} from "jsonwebtoken";
import dotenv from "dotenv";
import { payloadUserLogin } from "../models/auth.model";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      message: "Token não informado"
    });
  }
  
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Formato de token inválido",
    });
  }

  try {
    const payload = verify(
      token,
      JWT_SECRET
    );

    req.user = payload as payloadUserLogin;

    console.log("Usuário autenticado:", req.user);

    next();
  } catch {
    return res.status(401).json({
      message: "Token inválido"
    });
  }
}