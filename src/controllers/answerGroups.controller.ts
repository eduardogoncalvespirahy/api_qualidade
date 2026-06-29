import { Request, Response } from "express";
import { AnswerGroupsService } from "../services/answerGroups.service";

export class AnswerGroupsController {
  private readonly service: AnswerGroupsService;

  constructor() {
    this.service = new AnswerGroupsService();
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const item = await this.service.create(req.body);
      return res.status(201).json(item);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Erro ao criar AnswerGroups",
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
        message: error instanceof Error ? error.message : "Erro ao listar registros",
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
        message: error instanceof Error ? error.message : "AnswerGroups não encontrado",
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
        message: error instanceof Error ? error.message : "Erro ao atualizar registro",
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
        message: error instanceof Error ? error.message : "AnswerGroups não encontrado",
      });
    }
  };
}
