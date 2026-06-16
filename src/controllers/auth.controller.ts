import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  private service = new AuthService();

  login = async (req: Request, res: Response) => {
    try {
      const { username, email, registerNumber, password, systemId } = req.body;

      const result = await this.service.login({
        username,
        email,
        registerNumber,
        password,
        systemId,
      });

      return res.json(result);
    } catch (error: any) {
      return res.status(401).json({
        message: error.message,
      });
    }
  };
}
