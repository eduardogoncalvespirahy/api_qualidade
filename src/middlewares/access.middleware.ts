import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const SECRET_HASH_KEY_API = process.env.SECRET_HASH_KEY_API!;

export async function accessMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const password = String(req.headers.password);

  if (!password) {
    return res.status(401).json({
      message: "Password da API não informado"
    });
  }
  
  try {

    const access = await bcrypt.compare(password, SECRET_HASH_KEY_API);

    if (!access) {
        return res.status(401).json({
        message: "Senha de acesso da API Incorreta",
        });
    }

    console.log("API Autenticada");

    next();
  } catch {
    return res.status(401).json({
      message: "Token inválido"
    });
  }
}