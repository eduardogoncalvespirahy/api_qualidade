import { Request, Response } from "express";
import { FormTimeService } from "../services/formTime.service";

export class FormTimeController {
  private readonly service: FormTimeService;

  constructor() {
    this.service = new FormTimeService();
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const item = await this.service.create(req.body);
      return res.status(201).json(item);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Erro ao criar FormTime",
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
          error instanceof Error ? error.message : "Erro ao listar FormTimes",
      });
    }
  };

  findByformId = async (req: Request, res: Response): Promise<Response> => {
    try {
      const formId = req.params.formId as string;
      const item = await this.service.findByformId(formId);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error ? error.message : "FormTime não encontrado",
      });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const formId = req.params.formId as string;
      const item = await this.service.update(formId, req.body);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Erro ao atualizar FormTime",
      });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const formId = req.params.formId as string;
      await this.service.delete(formId);
      return res.status(204).send();
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error ? error.message : "FormTime não encontrado",
      });
    }
  };
}
