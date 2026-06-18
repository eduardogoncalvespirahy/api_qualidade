import { Request, Response } from "express";
import { SessionService } from "../services/session.service";

export class SessionController {
  private readonly service: SessionService;

  constructor() {
    this.service = new SessionService();
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const item = await this.service.create(req.body);
      return res.status(201).json(item);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Erro ao criar sessão",
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
        message: error instanceof Error ? error.message : "Erro ao listar sessões",
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
        message: error instanceof Error ? error.message : "Sessão não encontrada",
      });
    }
  };

  revoke = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = req.params.id as string;
      const item = await this.service.revoke(id);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(404).json({
        message: error instanceof Error ? error.message : "Sessão não encontrada",
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
        message: error instanceof Error ? error.message : "Sessão não encontrada",
      });
    }
  };
}
