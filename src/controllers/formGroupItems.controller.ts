import { Request, Response } from "express";
import { FormGroupItemsService } from "../services/formGroupItems.service";

export class FormGroupItemsController {
  private readonly service: FormGroupItemsService;

  constructor() {
    this.service = new FormGroupItemsService();
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
            : "Erro ao criar FormGroupItem",
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
      const formGroupId = req.params.formGroupId as string;
      const formId = req.params.formId as string;

      const item = await this.service.findById(formGroupId, formId);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "FormGroupItem não encontrado",
      });
    }
  };

  findByFormGroupId = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const formGroupId = req.params.formGroupId as string;

      const item = await this.service.findByFormGroupId(formGroupId);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "FormGroupItem(s) não encontrado(s)",
      });
    }
  };

  findByFormId = async (req: Request, res: Response): Promise<Response> => {
    try {
      const formId = req.params.formId as string;

      const item = await this.service.findByformId(formId);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "FormGroupItem(s) não encontrado(s)",
      });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const formGroupId = req.params.formGroupId as string;
      const formId = req.params.formId as string;

      const item = await this.service.update(formGroupId, formId, req.body);
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
      const formGroupId = req.params.formGroupId as string;
      const formId = req.params.formId as string;

      await this.service.delete(formGroupId, formId);
      return res.status(204).send();
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "FormGroupItem não encontrado",
      });
    }
  };
}
