import { Request, Response } from "express";
import { AnswerGroupItemsService } from "../services/answerGroupItems.service";

export class AnswerGroupItemsController {
  private readonly service: AnswerGroupItemsService;

  constructor() {
    this.service = new AnswerGroupItemsService();
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
            : "Erro ao criar AnswerGroupItem",
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
      const answerGroupId = req.params.answerGroupId as string;
      const answerId = req.params.answerId as string;

      const item = await this.service.findById(answerGroupId, answerId);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "AnswerGroupItem não encontrado",
      });
    }
  };

  findByAnswerGroupId = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const answerGroupId = req.params.answerGroupId as string;

      const item = await this.service.findByAnswerGroupId(answerGroupId);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "AnswerGroupItem(s) não encontrado(s)",
      });
    }
  };

  findByAnswerId = async (req: Request, res: Response): Promise<Response> => {
    try {
      const answerId = req.params.answerId as string;

      const item = await this.service.findByAnswerId(answerId);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "AnswerGroupItem(s) não encontrado(s)",
      });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const answerGroupId = req.params.answerGroupId as string;
      const answerId = req.params.answerId as string;

      const item = await this.service.update(answerGroupId, answerId, req.body);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Erro ao atualizar registro",
      });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const answerGroupId = req.params.answerGroupId as string;
      const answerId = req.params.answerId as string;

      await this.service.delete(answerGroupId, answerId);
      return res.status(204).send();
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "AnswerGroupItem não encontrado",
      });
    }
  };
}
