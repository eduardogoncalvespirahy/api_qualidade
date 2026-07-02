import { Request, Response } from "express";
import { CredentialLocationService } from "../services/credentialLocation.service";

export class CredentialLocationController {
  private readonly service: CredentialLocationService;

  constructor() {
    this.service = new CredentialLocationService();
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const item = await this.service.create(req.body);
      return res.status(201).json(item);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Erro ao vincular location",
      });
    }
  };

  findByCredential = async (req: Request, res: Response): Promise<Response> => {
    try {
      const credentialId = req.params.credentialId as string;
      const items = await this.service.findByCredential(credentialId);
      return res.status(200).json(items);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Erro ao listar vínculos",
      });
    }
  };

  findLocationNamesByCredential = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const credentialId = req.params.credentialId as string;
      const locationNames =
        await this.service.findLocationNamesByCredential(credentialId);
      return res.status(200).json(locationNames);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Erro ao listar vínculos",
      });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const credentialId = req.params.credentialId as string;
      const locationId = req.params.locationId as string;
      await this.service.delete(credentialId, locationId);
      return res.status(204).send();
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error ? error.message : "Vínculo não encontrado",
      });
    }
  };
}
