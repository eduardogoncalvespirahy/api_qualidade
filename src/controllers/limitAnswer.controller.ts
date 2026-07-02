import { Request, Response } from "express";
import { LimitAnswerService } from "../services/limitAnswer.service";

export class LimitAnswerController {
  private readonly service: LimitAnswerService;

  constructor() {
    this.service = new LimitAnswerService();
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const item = await this.service.create(req.body);

      return res.status(201).json(item);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Erro ao criar LimitAnswer",
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

  findallByAnswerId = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const answerId = req.params.answerId as string;
      const page = Number(req.query.page) || undefined;
      const limit = Number(req.query.limit) || undefined;

      const result = await this.service.findAllByAnswerId(
        answerId,
        page,
        limit,
      );

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
          error instanceof Error ? error.message : "LimitAnswer não encontrado",
      });
    }
  };

  findByAnswerId = async (req: Request, res: Response): Promise<Response> => {
    try {
      const answerId = req.params.answerId as string;

      const items = await this.service.findByAnswerId(answerId);

      return res.status(200).json(items);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao listar LimitAnswers",
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
            : "Erro ao atualizar LimitAnswer",
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
          error instanceof Error ? error.message : "LimitAnswer não encontrado",
      });
    }
  };
}
