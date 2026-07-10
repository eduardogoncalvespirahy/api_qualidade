import { Request, Response } from "express";
import { RepairerAnswerResultService } from "../services/repairerAnswerResult.service";

export class RepairerAnswerResultController {
  private readonly service: RepairerAnswerResultService;

  constructor() {
    this.service = new RepairerAnswerResultService();
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
            : "Erro ao criar RepairerAnswerResult",
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
            : "Erro ao listar RepairerAnswerResult",
      });
    }
  };

  findById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const answerResultId = req.params.answerResultId as string;
      const userId = req.params.userId as string;

      const item = await this.service.findById(answerResultId, userId);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "RepairerAnswerResult não encontrado",
      });
    }
  };

  answerResultId = async (req: Request, res: Response): Promise<Response> => {
    try {
      const answerResultId = req.params.answerResultId as string;

      const item = await this.service.findByAnswerResultId(answerResultId);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "RepairerAnswerResult não encontrado",
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
            : "RepairerAnswerResult não encontrado",
      });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const answerResultId = req.params.answerResultId as string;
      const userId = req.params.userId as string;

      const item = await this.service.update(answerResultId, userId, req.body);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar RepairerAnswerResult",
      });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const answerResultId = req.params.answerResultId as string;
      const userId = req.params.userId as string;

      await this.service.delete(answerResultId, userId);
      return res.status(204).send();
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "RepairerAnswerResult não encontrado",
      });
    }
  };
}
