import { Request, Response } from "express";
import { FaceService } from "../services/face/face.service";

export class FaceController {
  private service = new FaceService();

  // POST /face/enroll/:userId  — body: { registerNumber } (foto do Senior) ou { image }
  enroll = async (req: Request, res: Response) => {
    // try {
      const userId = req.params.userId as string;
      const { registerNumber, image } = req.body;

      if (image) {
        await this.service.enrollFromImage(userId, image);
      } else if (registerNumber !== undefined) {
        await this.service.enrollFromSenior(userId, String(registerNumber));
      } else {
        return res.status(400).json({
          message: "Informe 'registerNumber' (foto do Senior) ou 'image'.",
        });
      }

      return res.status(204).send();
    // } catch (error: any) {
    //   return res.status(400).json({ message: error.message });
    // }
  };
}
