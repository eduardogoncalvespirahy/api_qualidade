import { Request, Response } from "express";
import { MachineAnswerResultService } from "../services/machineAnswerResult.service";

export class MachineAnswerResultController {
  private readonly service: MachineAnswerResultService;

  constructor() {
    this.service = new MachineAnswerResultService();
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const item = await this.service.create(req.body);

      return res.status(201).json(item);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao criar MachineAnswerResult",
      });
    }
  };

  findAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const page = Number(req.query.page) || undefined;
      const limit = Number(req.query.limit) || undefined;

      const result = await this.service.findAll(page, limit);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Erro ao listar registros",
      });
    }
  };

  findById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = req.params.id as string;

      const item = await this.service.findById(id);

      return res.status(200).json(item);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "MachineAnswerResult não encontrado",
      });
    }
  };

  findByMachineAnswerId = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const machineAnswerId = req.params.machineAnswerId as string;

      const items = await this.service.findByMachineAnswerId(machineAnswerId);

      return res.status(200).json(items);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao listar MachineAnswerResults",
      });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = req.params.id as string;

      const item = await this.service.update(id, req.body);

      return res.status(200).json(item);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar MachineAnswerResult",
      });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = req.params.id as string;

      await this.service.delete(id);

      return res.status(204).send();
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "MachineAnswerResult não encontrado",
      });
    }
  };
}
