import { Request, Response } from "express";
import { ControlStatusService } from "../services/controlStatus.service";

export class ControlStatusController {
  private readonly service: ControlStatusService;

  constructor() {
    this.service = new ControlStatusService();
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const item = await this.service.create(req.body);
      return res.status(201).json(item);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Erro ao vincular status",
      });
    }
  };

  findByControl = async (req: Request, res: Response): Promise<Response> => {
    try {
      const controlId = req.params.controlId as string;
      const items = await this.service.findByControl(controlId);
      return res.status(200).json(items);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Erro ao listar vínculos",
      });
    }
  };

  findStatusNamesByControl = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const controlId = req.params.controlId as string;
      const statusNames =
        await this.service.findStatusNamesByControl(controlId);
      return res.status(200).json(statusNames);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Erro ao listar vínculos",
      });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const controlId = req.params.controlId as string;
      const statusId = req.params.statusId as string;
      const updated = await this.service.update(controlId, statusId);
      return res.status(200).json(updated);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Erro ao atualizar vínculo",
      });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const controlId = req.params.controlId as string;
      const statusId = req.params.statusId as string;
      await this.service.delete(controlId, statusId);
      return res.status(204).send();
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error ? error.message : "Vínculo não encontrado",
      });
    }
  };
}
