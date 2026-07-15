import { Request, Response } from "express";
import { RepairerMachineAnswerResultService } from "../services/repairerMachineAnswerResult.service";

export class RepairerMachineAnswerResultController {
  private readonly service: RepairerMachineAnswerResultService;

  constructor() {
    this.service = new RepairerMachineAnswerResultService();
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
            : "Erro ao criar RepairerMachineAnswerResult",
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
          error instanceof Error
            ? error.message
            : "Erro ao listar RepairerMachineAnswerResult",
      });
    }
  };

  findById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const machineAnswerResultId = req.params.machineAnswerResultId as string;
      const userId = req.params.userId as string;

      const item = await this.service.findById(machineAnswerResultId, userId);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "RepairerMachineAnswerResult não encontrado",
      });
    }
  };

  findByMachineAnswerResultId = async (req: Request, res: Response): Promise<Response> => {
    try {
      const machineAnswerResultId = req.params.machineAnswerResultId as string;

      const item = await this.service.findByMachineAnswerResultId(machineAnswerResultId);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "RepairerMachineAnswerResult não encontrado",
      });
    }
  };

  findByUserId = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = req.params.userId as string;

      const item = await this.service.findByUserId(userId);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "RepairerMachineAnswerResult não encontrado",
      });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const machineAnswerResultId = req.params.machineAnswerResultId as string;
      const userId = req.params.userId as string;

      const item = await this.service.update(machineAnswerResultId, userId, req.body);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar RepairerMachineAnswerResult",
      });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const machineAnswerResultId = req.params.machineAnswerResultId as string;
      const userId = req.params.userId as string;

      await this.service.delete(machineAnswerResultId, userId);
      return res.status(204).send();
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "RepairerMachineAnswerResult não encontrado",
      });
    }
  };
}
