import { Request, Response } from "express";
import { FaceAuthService } from "../services/faceAuth.service";

export class FaceAuthController {
  private service = new FaceAuthService();

  login = async (req: Request, res: Response) => {
    try {
      const { username, email, registerNumber, systemId, image } = req.body;

      const result = await this.service.login({
        username,
        email,
        registerNumber,
        systemId,
        image,
      });

      return res.json(result);
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  };
}
